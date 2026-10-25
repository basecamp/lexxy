const eventsLog = document.querySelector(".events")
const form = document.querySelector("form")

const eventTypes = [
  "lexxy:focus",
  "lexxy:blur",
  "lexxy:change",
  "lexxy:insert-link",
  "lexxy:insert-markdown",
  "lexxy:file-accept",
  "lexxy:upload-start",
  "lexxy:upload-progress",
  "lexxy:upload-end",
]

for (const eventType of eventTypes) {
  form.addEventListener(eventType, (event) => {
    const div = document.createElement("div")
    div.textContent = event.type
    div.dataset.event = event.type
    eventsLog.appendChild(div)
  })
}
