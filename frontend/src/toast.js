let listener = null;
let nextId = 0;

export const toast = {
  success: (msg) => emit("success", msg),
  error:   (msg) => emit("error",   msg),
  info:    (msg) => emit("info",    msg),
};

function emit(type, message) {
  if (listener) listener({ id: ++nextId, type, message });
}

export function setToastListener(fn) {
  listener = fn;
}
