/**
 * Клиент форм «Мой Город Мечты».
 * Подключите скрипт на странице и добавьте форме атрибут data-lead-form
 * (значение — название формы, оно уйдёт в заявку как источник).
 *
 * Поля (name): name/имя, phone/телефон, date/дата,
 * service|zone|услуга|зона, comment/комментарий.
 * Скрытое поле website — honeypot против ботов, его не нужно заполнять.
 *
 * Пример:
 * <form data-lead-form="Форма на главной">
 *   <input name="name" required>
 *   <input name="phone" required>
 *   <input name="date">
 *   <input name="service">
 *   <textarea name="comment"></textarea>
 *   <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">
 *   <button type="submit">Отправить</button>
 * </form>
 */
(function () {
  const ENDPOINT = "https://mgm-leads.mldetailing.workers.dev";
  const CLIENT_KEY = '0f710dc2c0cd8b034cec8b769aa84563b5e9845c7ba17558';

  function pick(form, names) {
    for (const name of names) {
      const field = form.elements.namedItem(name);
      if (!field) continue;
      const value = String(field.value || "").trim();
      if (value) return value;
    }
    return "";
  }

  function setStatus(form, text, ok) {
    let node = form.querySelector("[data-lead-status]");
    if (!node) {
      node = document.createElement("p");
      node.setAttribute("data-lead-status", "");
      node.style.marginTop = "12px";
      form.appendChild(node);
    }
    node.textContent = text;
    node.dataset.ok = ok ? "1" : "0";
  }

  document.addEventListener(
    "submit",
    async (event) => {
      const form = event.target && event.target.closest && event.target.closest("form[data-lead-form]");
      if (!form) return;
      event.preventDefault();

      if (form.dataset.leadBusy === "1") return;
      form.dataset.leadBusy = "1";

      const payload = {
        name: pick(form, ["name", "имя", "fio", "fullName", "full_name"]),
        phone: pick(form, ["phone", "телефон", "tel", "mobile"]),
        date: pick(form, ["date", "дата", "bookingDate", "booking_date"]),
        service: pick(form, ["service", "zone", "usluga", "zona", "услуга", "зона", "area"]),
        comment: pick(form, ["comment", "комментарий", "message", "notes", "note", "text"]),
        source: (form.getAttribute("data-lead-form") || "").trim(),
        website: pick(form, ["website", "company", "honeypot", "_gotcha", "fax"]),
      };

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setStatus(form, "Отправляем заявку…", true);

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Lead-Key": CLIENT_KEY,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "send_failed");
        }
        setStatus(form, "Спасибо! Мы получили заявку.", true);
        form.reset();
      } catch (err) {
        setStatus(form, "Не получилось отправить. Позвоните нам или попробуйте ещё раз.", false);
      } finally {
        form.dataset.leadBusy = "0";
        if (submitBtn) submitBtn.disabled = false;
      }
    },
    true,
  );
})();
