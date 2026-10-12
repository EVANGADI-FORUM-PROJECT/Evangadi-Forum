let ioInstance = null;

// Called once, from initSocket() when the server starts.
export const setIO = io => {
    ioInstance = io;
};

// Any service can call this to push a live event, e.g.:
//   getIO().to(userRoom(userId)).emit("notification:new", payload)
export const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.io has not been initialized yet");
    }
    return ioInstance;
};

// Every connected user joins a private room named after their own user id,
// so we can target (or exclude) exactly one user without the server having
// to track which socket connection belongs to which user itself.
export const userRoom = userId => `user:${userId}`;
