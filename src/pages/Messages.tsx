import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, Film, MessageCircle, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { PageHero, PageShell, SectionTitle } from "@/components/PageChrome";
import { EmptyState, PermissionState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listEventRegistrations,
  listNotificationsForUser,
  listShowcaseIntents,
  markNotificationRead,
  NotificationItem,
} from "@/services/engagementService";
import { getProjectConversationsForUser, type ProjectConversation } from "@/services/projectConversationService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const noticeIconMap: Record<NotificationItem["type"], typeof ShoppingBag> = {
  "showcase-intent": ShoppingBag,
  "event-registration": CalendarDays,
  "project-update": Film,
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationMeta(conversation: ProjectConversation) {
  const parts = [
    conversation.participantNames.length ? conversation.participantNames.join("、") : "项目双方",
    `${conversation.messageCount} 条沟通`,
    `${conversation.notificationCount} 条动态`,
  ];
  return parts.join(" · ");
}

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => listNotificationsForUser(user));
  const showcaseIntents = useMemo(() => listShowcaseIntents(), []);
  const eventRegistrations = useMemo(() => listEventRegistrations(), []);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const notificationDigest = useMemo(
    () => notifications.map((item) => `${item.id}:${item.read ? "read" : "unread"}`).join("|"),
    [notifications]
  );
  const {
    data: projectConversations = [],
    isLoading: conversationsLoading,
    refetch: refetchProjectConversations,
  } = useQuery({
    queryKey: ["project-conversations", user?.id, user?.role, notificationDigest],
    queryFn: () => getProjectConversationsForUser(user),
    enabled: !!user,
  });

  useEffect(() => {
    setNotifications(listNotificationsForUser(user));
  }, [user]);

  function handleRead(item: NotificationItem) {
    if (!item.read) {
      markNotificationRead(item.id);
      setNotifications(listNotificationsForUser(user));
      void refetchProjectConversations();
    }
    if (item.targetPath) navigate(item.targetPath);
  }

  function handleConversationOpen(conversation: ProjectConversation) {
    if (conversation.unreadNotificationIds.length) {
      conversation.unreadNotificationIds.forEach((id) => markNotificationRead(id));
      setNotifications(listNotificationsForUser(user));
      void refetchProjectConversations();
    }
    navigate(conversation.targetPath);
  }

  if (!user) {
    return (
      <PageShell tone="muted">
        <Navbar />
        <PermissionState
          title="请先登录"
          description="登录后可以查看橱窗沟通、活动报名和项目节点提醒。"
          actionLabel="去登录"
          onAction={() => navigate("/login")}
        />
      </PageShell>
    );
  }

  return (
    <PageShell tone="muted">
      <Navbar />
      <PageHero
        eyebrow="Message Center"
        title="消息中心"
        description="集中查看橱窗沟通意向、活动报名记录和后续节点提醒，避免关键流程提交后没有落点。"
        stats={[
          { label: "未读消息", value: unreadCount },
          { label: "项目会话", value: projectConversations.length },
          { label: "橱窗意向", value: showcaseIntents.length },
          { label: "活动报名", value: eventRegistrations.length },
        ]}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-8">
          <div>
            <SectionTitle title="项目会话" description="按项目聚合私信、交付批注、托管和纠纷裁决提醒。" />
            {conversationsLoading ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                正在同步项目会话...
              </div>
            ) : projectConversations.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="h-5 w-5" />}
                title="暂时没有项目会话"
                description="发起邀约、发送项目消息或进入交付节点后，项目动态会聚合在这里。"
                actionLabel="查看项目"
                onAction={() => navigate(user.role === "aigcer" ? "/dashboard/aigcer" : "/dashboard/client")}
              />
            ) : (
              <div className="space-y-3">
                {projectConversations.map((conversation) => (
                  <button
                    key={conversation.commissionId}
                    type="button"
                    onClick={() => handleConversationOpen(conversation)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
                      conversation.unreadCount ? "border-primary/25" : "border-border"
                    )}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-card-foreground">{conversation.title}</p>
                        {conversation.unreadCount > 0 && <Badge className="rounded-full">未读 {conversation.unreadCount}</Badge>}
                        {conversation.priority === "high" && <Badge variant="destructive" className="rounded-full">高优先级</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{conversation.lastPreview}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatConversationMeta(conversation)}</span>
                        <span>{formatTime(conversation.latestAt)}</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionTitle title="最新消息" description="点击消息可标记为已读，关联入口会保留在记录中。" />
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title="暂时没有消息"
                description="完成橱窗沟通或活动报名后，对应提醒会出现在这里。"
                actionLabel="去逛橱窗"
                onAction={() => navigate("/showcase")}
              />
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => {
                  const Icon = noticeIconMap[item.type];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRead(item)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
                        item.read ? "border-border" : "border-primary/25"
                      )}
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-card-foreground">{item.title}</p>
                          {!item.read && <Badge className="rounded-full">未读</Badge>}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        <p className="mt-3 text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">橱窗意向</h2>
              <Badge variant="outline">{showcaseIntents.length}</Badge>
            </div>
            {showcaseIntents.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">还没有提交过橱窗沟通。</p>
            ) : (
              <div className="space-y-3">
                {showcaseIntents.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-sm font-medium text-foreground">{item.serviceTitle}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.requirement}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">活动报名</h2>
              <Badge variant="outline">{eventRegistrations.length}</Badge>
            </div>
            {eventRegistrations.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">报名后会在这里显示活动与作品信息。</p>
            ) : (
              <div className="space-y-3">
                {eventRegistrations.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">{item.eventTitle}</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.workTitle ?? "暂未填写作品名称"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </main>
    </PageShell>
  );
};

export default Messages;
