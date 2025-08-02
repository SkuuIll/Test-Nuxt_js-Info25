/**
 * TypeScript types for notifications system
 */

export interface User {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
}

export interface Notification {
    id: number
    recipient: User
    sender?: User
    notification_type: NotificationType
    title: string
    message: string
    priority: NotificationPriority
    data: Record<string, any>
    action_url?: string
    is_read: boolean
    is_dismissed: boolean
    delivered_at?: string
    read_at?: string
    created_at: string
    updated_at: string
    expires_at?: string
    age_in_days: number
    is_expired: boolean
    notification_type_display?: string
    priority_display?: string
    created_at_formatted?: string
    read_at_formatted?: string
}

export type NotificationType =
    | 'comment'
    | 'user_registration'
    | 'post_published'
    | 'post_featured'
    | 'system_announcement'
    | 'moderation_required'
    | 'post_liked'
    | 'comment_reply'
    | 'user_followed'
    | 'content_approved'
    | 'content_rejected'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface NotificationPreferences {
    id?: number
    user?: User
    email_notifications: boolean
    push_notifications: boolean
    in_app_notifications: boolean
    notify_comments: boolean
    notify_comment_replies: boolean
    notify_post_likes: boolean
    notify_user_follows: boolean
    notify_post_featured: boolean
    notify_content_moderation: boolean
    notify_system_announcements: boolean
    notify_user_registrations: boolean
    notify_moderation_required: boolean
    notify_post_published: boolean
    quiet_hours_enabled: boolean
    quiet_hours_start?: string
    quiet_hours_end?: string
    digest_frequency: 'never' | 'daily' | 'weekly' | 'monthly'
    created_at?: string
    updated_at?: string
}

export interface NotificationStats {
    total_notifications: number
    unread_notifications: number
    notifications_by_type: Record<string, number>
    notifications_by_priority: Record<string, number>
    recent_notifications_count: number
}

export interface NotificationListResponse {
    results: Notification[]
    count: number
    next?: string
    previous?: string
    unread_count: number
}

export interface BulkNotificationAction {
    notification_ids: number[]
    action: 'mark_read' | 'mark_unread' | 'dismiss'
}

export interface SystemAnnouncement {
    title: string
    message: string
    priority: NotificationPriority
    target_group: 'all_users' | 'staff_users' | 'admin_users'
    expires_at?: string
}

export interface WebSocketMessage {
    type: 'notification' | 'notification_update' | 'system_announcement' | 'ping' | 'pong' | 'connection_established'
    notification?: Notification
    update?: {
        type: 'marked_read' | 'marked_all_read' | 'dismissed'
        notification_id?: number
        count?: number
        unread_count?: number
    }
    announcement?: Notification
    message?: string
    timestamp?: number
}

export interface NotificationFilters {
    include_read?: boolean
    include_dismissed?: boolean
    notification_type?: NotificationType
    priority?: NotificationPriority
    date_from?: string
    date_to?: string
    search?: string
    page?: number
    page_size?: number
}

export interface ToastNotification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    priority: NotificationPriority
    duration?: number
    action_url?: string
    persistent?: boolean
}

export interface NotificationError {
    message: string
    code?: string
    details?: any
}