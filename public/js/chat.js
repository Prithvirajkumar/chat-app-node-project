const socket = io();
const formElement = document.querySelector("#message-form");
const formInput = document.querySelector("#message-form-input");
const formButton = document.querySelector("#message-form-input-button");
const geoButton = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // new message element
  const newMessage = messages.lastElementChild;

  // get height of newMessage
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = messages.offsetHeight;

  // height of messages container
  const containerHeight = messages.scrollHeight;

  // how far have I scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (locationMessage) => {
  console.log(locationMessage);
  const html = Mustache.render(locationTemplate, {
    username: locationMessage.username,
    locationMessage: locationMessage.coords,
    createdAt: moment(locationMessage.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

const geoButtonClick = geoButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("GeoLocation is not supported by your browser");
  }
  geoButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = {
      latitude,
      longitude,
    };
    socket.emit("sendLocation", coords, (message) => {
      geoButton.removeAttribute("disabled");
      console.log(message);
    });
  });
});

const formSubmit = formElement.addEventListener("submit", (event) => {
  event.preventDefault();
  formButton.setAttribute("disabled", "disabled");
  const message = formInput.value;

  socket.emit("sendMessage", message, (error) => {
    formButton.removeAttribute("disabled");
    formInput.value = "";
    formInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("message delivered");
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
