const { readJSON, writeJSON } = require('./jsonUtils');

/**
 * Create a notification for a user
 * @param {string} userId - The user ID
 * @param {string} type - The notification type (ticket_response, sanction_ban, server_suspended, etc.)
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 */
function createNotification(userId, type, title, message) {
  try {
    const notifications = readJSON('notifications.json');
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: String(userId),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.push(newNotification);
    writeJSON('notifications.json', notifications);
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create multiple notifications (e.g., for all moderators)
 */
function createNotificationsForUsers(userIds, type, title, message) {
  return userIds.map(userId => createNotification(userId, type, title, message));
}

/**
 * Create a notification for all admins
 */
function notifyAdmins(type, title, message) {
  try {
    const users = readJSON('users.json');
    const admins = users.filter(u => ['admin', 'developer'].includes(u.role));
    return admins.map(admin => createNotification(admin.id, type, title, message));
  } catch (error) {
    console.error('Error notifying admins:', error);
    return [];
  }
}

/**
 * Create a notification for all moderators (including admins)
 */
function notifyModerators(type, title, message) {
  try {
    const users = readJSON('users.json');
    const moderators = users.filter(u => ['moderator', 'admin', 'developer'].includes(u.role));
    return moderators.map(mod => createNotification(mod.id, type, title, message));
  } catch (error) {
    console.error('Error notifying moderators:', error);
    return [];
  }
}

module.exports = {
  createNotification,
  createNotificationsForUsers,
  notifyAdmins,
  notifyModerators
};
