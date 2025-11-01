"use strict";
const utils = require('../../../utils');

module.exports = function (defaultFuncs, api, ctx) {
  async function cleanupResources() {
    try {
      if (ctx.mqttClient) {
        try {
          utils.log("logout", "Disconnecting MQTT client...");
          ctx.mqttClient.end(true);
          ctx.mqttClient = null;
          utils.log("logout", "MQTT client disconnected.");
        } catch (mqttErr) {
          utils.log("logout", "Error disconnecting MQTT (non-critical): " + mqttErr.message);
        }
      }

      if (ctx.presenceInterval) {
        clearInterval(ctx.presenceInterval);
        ctx.presenceInterval = null;
      }

      if (ctx.cookieRefreshManager) {
        try {
          ctx.cookieRefreshManager.stop();
        } catch (stopErr) {
        }
      }

      ctx.loggedIn = false;
      ctx.mqttConnected = false;
    } catch (cleanupErr) {
      utils.error("logout", "Error during cleanup:", cleanupErr.message);
    }
  }

  async function logoutViaAPI() {
    try {
      const logoutUrl = "https://www.facebook.com/logout.php";
      const logoutForm = {
        h: ctx.fb_dtsg || "",
        fb_dtsg: ctx.fb_dtsg || ""
      };

      await defaultFuncs.post(logoutUrl, ctx.jar, logoutForm);
      utils.log("logout", "Logged out via API method.");
      return true;
    } catch (err) {
      utils.log("logout", "API logout method failed:", err.message);
      return false;
    }
  }

  async function logoutViaClassic() {
    try {
      const form = { pmid: "0" };

      const resData = await defaultFuncs
        .post(
          "https://www.facebook.com/bluebar/modern_settings_menu/?help_type=364455653583099&show_contextual_help=1",
          ctx.jar,
          form,
        )
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

      if (!resData || !resData.jsmods || !resData.jsmods.instances || !resData.jsmods.instances[0]) {
        utils.log("logout", "Classic logout: Session already logged out.");
        return false;
      }

      const elem = resData.jsmods.instances[0][2][0].find(v => v.value === "logout");
      if (!elem || !elem.markup || !elem.markup.__m) {
        utils.log("logout", "Classic logout: Could not find logout element.");
        return false;
      }
      
      const markupElement = resData.jsmods.markup ? resData.jsmods.markup.find(v => v && v[0] === elem.markup.__m) : null;
      if (!markupElement || !markupElement[1] || !markupElement[1].__html) {
        utils.log("logout", "Classic logout: Could not find markup.");
        return false;
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

      if (logoutRes.headers && logoutRes.headers.location) {
        await defaultFuncs
          .get(logoutRes.headers.location, ctx.jar)
          .then(utils.saveCookies(ctx.jar));
      }
      
      utils.log("logout", "Logged out via classic method.");
      return true;
    } catch (err) {
      utils.log("logout", "Classic logout method failed:", err.message);
      return false;
    }
  }

  return async function logout() {
    try {
      if (!ctx || !ctx.jar) {
        utils.log("logout", "No active session to logout from.");
        if (ctx) ctx.loggedIn = false;
        return;
      }

      utils.log("logout", "Attempting to logout...");

      await cleanupResources();

      const apiSuccess = await logoutViaAPI();
      
      if (!apiSuccess) {
        const classicSuccess = await logoutViaClassic();
        
        if (!classicSuccess) {
          utils.log("logout", "All logout methods exhausted. Session cleaned up locally.");
        }
      }

      ctx.loggedIn = false;
      utils.log("logout", "Logout completed successfully.");

    } catch (err) {
      utils.error("logout", "Logout error:", err);
      
      await cleanupResources();
      
      if (ctx) ctx.loggedIn = false;
      utils.log("logout", "Session marked as logged out despite error.");
    }
  };
};
