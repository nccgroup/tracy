// newTracyNotification checks the browser supports notifications,
// then either asks permission for notifications, or displays the
// formatted notification if the user has already granted permission.
export const newTracyNotification = (tracerPayload, context, onclick) => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    // Let's check whether notification permissions have already been granted
    // If it's okay let's create a notification
    tracyNotification(tracerPayload, context, onclick);
  } else if (Notification.permission !== "denied") {
    // Otherwise, we need to ask the user for permission
    Notification.requestPermission((permission) => {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        tracyNotification(tracerPayload, context, onclick);
      }
    });
  }
};

// tracyNotification creates a notification with the tracy logo
// and standard default options, such as requiring interaction.
const tracyNotification = (tracerPayload, context, onclick) => {
  const title = "Tracy found XSS!";
  const body = `Tracer Payload: ${tracerPayload}
  Severity: ${context.Severity}
  HTML Parent Tag: ${context.HTMLNodeType}`;
  const opts = {
    body: body,
    icon:
      "https://user-images.githubusercontent.com/16947503/38943629-c354d81a-42e6-11e8-9644-cc956d92fbcc.png",
    requireInteraction: true,
    sticky: true,
  };

  const n = new Notification(title, opts);
  n.onclick = onclick;
};
