package org.exoplatform.addons.chat.utils;

import org.exoplatform.addons.chat.model.MentionModel;
import org.exoplatform.chat.services.ChatService;
import org.exoplatform.commons.api.notification.NotificationMessageUtils;
import org.exoplatform.commons.api.notification.channel.template.TemplateProvider;
import org.exoplatform.commons.api.notification.model.*;
import org.exoplatform.commons.api.notification.plugin.NotificationPluginUtils;
import org.exoplatform.commons.api.notification.service.template.TemplateContext;
import org.exoplatform.commons.utils.CommonsUtils;
import org.exoplatform.portal.config.UserPortalConfigService;
import org.exoplatform.webui.utils.TimeConvertUtils;

import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class NotificationUtils {

    public static final ArgumentLiteral<MentionModel> MENTION_MODEL                                 =
            new ArgumentLiteral<>(MentionModel.class, "mention_model");

    public static final String                CHAT_MENTION_NOTIFICATION_PLUGIN   = "ChatMentionNotificationPlugin";

    public static final PluginKey             CHAT_MENTION_KEY                          =
            PluginKey.key(CHAT_MENTION_NOTIFICATION_PLUGIN);

    private static String                     defaultSite;


    public static final void setNotificationRecipients(NotificationInfo notification, List<String> users) {
        notification.to(users);
    }

    public static final TemplateContext buildTemplateParameters(TemplateProvider templateProvider,
                                                                NotificationInfo notification) {

        String language = NotificationPluginUtils.getLanguage(notification.getTo());
        TemplateContext templateContext = getTemplateContext(templateProvider, notification, language);
        Boolean isRead = Boolean.valueOf(notification.getValueOwnerParameter(NotificationMessageUtils.READ_PORPERTY.getKey()));
        templateContext.put("READ", isRead != null && isRead.booleanValue() ? "read" : "unread");
        templateContext.put("NOTIFICATION_ID", notification.getId());
        templateContext.put("ROOM_ID", notification.getValueOwnerParameter("roomId"));
        templateContext.put("ROOM_NAME", notification.getValueOwnerParameter("roomName"));
        templateContext.put("USER", notification.getValueOwnerParameter("senderFullName"));
        templateContext.put("CHAT_URL", getRoomURL(notification.getValueOwnerParameter("roomId")));
        String userAvatar = ChatService.USER_AVATAR_URL.replace("{}", notification.getValueOwnerParameter("sender"));
        templateContext.put("AVATAR", userAvatar);
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(notification.getLastModifiedDate());
        templateContext.put("LAST_UPDATED_TIME",
                TimeConvertUtils.convertXTimeAgoByTimeServer(cal.getTime(),
                        "EE, dd yyyy",
                        new Locale(language),
                        TimeConvertUtils.YEAR));

        return templateContext;
    }
    private static final TemplateContext getTemplateContext(TemplateProvider templateProvider,
                                                            NotificationInfo notification,
                                                            String language) {
        PluginKey pluginKey = notification.getKey();
        String pluginId = pluginKey.getId();
        ChannelKey channelKey = templateProvider.getChannelKey();
        return TemplateContext.newChannelInstance(channelKey, pluginId, language);
    }

    public static String getDefaultSite() {
        if (defaultSite != null) {
            return defaultSite;
        }
        UserPortalConfigService portalConfig = CommonsUtils.getService(UserPortalConfigService.class);
        defaultSite = portalConfig.getDefaultPortal();
        return defaultSite;
    }

    public static String getRoomURL(String roomId) {
        String currentSite = getDefaultSite();
        String currentDomain = CommonsUtils.getCurrentDomain();
        if (!currentDomain.endsWith("/")) {
            currentDomain += "/";
        }
        String notificationURL = "";
        if (roomId != null) {
            notificationURL = currentDomain + "portal/" + currentSite + "/chat?roomId=" + roomId;
        } else {
            notificationURL = currentDomain + "portal/" + currentSite + "/chat";
        }
        return notificationURL;
    }

}