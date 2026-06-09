export const ROUTES = {
  // Auth
  LOGIN: '/(auth)/login',
  REGISTER_REQUESTER: '/(auth)/register-requester',
  REGISTER_TECHNICIAN: '/(auth)/register-technician',
  FORGOT_PASSWORD: '/(auth)/forgot-password',

  // Requester
  REQUESTER_HOME: '/(requester)/home',
  REQUESTER_TICKETS: '/(requester)/tickets',
  REQUESTER_OPEN_TICKETS: '/(requester)/open-tickets',
  REQUESTER_NOTIFICATIONS: '/(requester)/notifications',
  REQUESTER_PROFILE: '/(requester)/profile',

  // Technician
  TECHNICIAN_MY_TICKETS: '/(technician)/my-tickets',
  TECHNICIAN_ALL_TICKETS: '/(technician)/all-tickets',
  TECHNICIAN_NOTIFICATIONS: '/(technician)/notifications',
  TECHNICIAN_PROFILE: '/(technician)/profile',

  // Admin
  ADMIN_APPROVALS: '/(admin)/approvals',
  ADMIN_BROADCASTS: '/(admin)/broadcasts',
  ADMIN_ALL_TICKETS: '/(admin)/all-tickets',
  ADMIN_NOTIFICATIONS: '/(admin)/notifications',
  ADMIN_PROFILE: '/(admin)/profile',

  // Shared
  TICKET_DETAIL: (id: string) => `/tickets/${id}` as const,
  CREATE_TICKET: '/create-ticket',
} as const;
