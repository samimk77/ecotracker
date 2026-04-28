/**
 * Socket.io handler for EcoTrack.
 * Rooms:
 *   issue:<id>         — viewers of a specific issue
 *   event:<id>         — viewers of a specific event
 *   ward:<name>        — all users in a ward (for new issue/event broadcasts)
 *   ward:<name>:mods   — moderators in a ward
 *   user:<userId>      — personal notifications
 */
const initSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Client joins an issue room (to get live upvote/verification updates)
    socket.on('join:issue', (issueId) => {
      socket.join(`issue:${issueId}`);
    });

    socket.on('leave:issue', (issueId) => {
      socket.leave(`issue:${issueId}`);
    });

    // Client joins an event room (live participant + funding updates)
    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // Client joins a ward room (ward-level broadcasts)
    socket.on('join:ward', (wardName) => {
      socket.join(`ward:${wardName}`);
    });

    socket.on('leave:ward', (wardName) => {
      socket.leave(`ward:${wardName}`);
    });

    // Mods join their ward mod room
    socket.on('join:ward:mods', (wardName) => {
      socket.join(`ward:${wardName}:mods`);
    });

    // Personal notification room (user joins with their userId)
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSockets };
