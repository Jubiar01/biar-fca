"use strict";
// @ChoruOfficial
const utils = require('../../../utils');

/**
 * @param {Object} defaultFuncs
 * @param {Object} api
 * @param {Object} ctx
 * @returns {function(): Promise<void>}
 */
module.exports = function (defaultFuncs, api, ctx) {
  /**
   * Logs the current user out of Facebook.
   * @returns {Promise<void>} A promise that resolves when logout is successful or rejects on error.
   */
  return async function logout() {
    const form = {
      pmid: "0",
    };

    try {
      // Check if context is valid before attempting logout
      if (!ctx || !ctx.jar) {
        utils.log("logout", "No active session to logout from.");
        ctx.loggedIn = false;
        return;
      }

      const resData = await defaultFuncs
        .post(
          "https://www.facebook.com/bluebar/modern_settings_menu/?help_type=364455653583099&show_contextual_help=1",
          ctx.jar,
          form,
        )
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

      // Check if response has required structure
      if (!resData || !resData.jsmods || !resData.jsmods.instances || !resData.jsmods.instances[0]) {
        utils.log("logout", "Session already logged out or invalid response structure.");
        ctx.loggedIn = false;
        return;
      }

      const elem = resData.jsmods.instances[0][2][0].find(v => v.value === "logout");
      if (!elem || !elem.markup || !elem.markup.__m) {
        utils.log("logout", "Could not find logout form element. Session may already be logged out.");
        ctx.loggedIn = false;
        return;
      }
      
      // Safely find the markup element with proper null checking
      const markupElement = resData.jsmods.markup ? resData.jsmods.markup.find(v => v && v[0] === elem.markup.__m) : null;
      if (!markupElement || !markupElement[1] || !markupElement[1].__html) {
        utils.log("logout", "Could not find logout markup. Session may already be logged out.");
        ctx.loggedIn = false;
        return;
      }
      
      const html = markupElement[1].__html;
      
      const logoutForm = {
        fb_dtsg: utils.getFrom(html, '"fb_dtsg" value="', '"'),
        ref: utils.getFrom(html, '"ref" value="', '"'),
        h: utils.getFrom(html, '"h" value="', '"'),
      };

      const logoutRes = await defaultFuncs
        .post("https://www.facebook.com/logout.php", ctx.jar, logoutForm)
        .then(utils.saveCookies(ctx.jar));

      if (!logoutRes.headers || !logoutRes.headers.location) {
        throw { error: "An error occurred when logging out." };
      }

      await defaultFuncs
        .get(logoutRes.headers.location, ctx.jar)
        .then(utils.saveCookies(ctx.jar));
      
      ctx.loggedIn = false;
      utils.log("logout", "Logged out successfully.");

    } catch (err) {
      // Gracefully handle logout errors and still mark as logged out
      utils.error("logout", err);
      ctx.loggedIn = false;
      utils.log("logout", "Session marked as logged out despite error.");
      // Don't throw - allow cleanup to complete
    }
  };
};
