export const tradeInclude = {
  owner: {
    select: {
      id: true,
      username: true,
      tradesCompleted: true,
    },
  },
  counterparty: {
    select: {
      id: true,
      username: true,
      tradesCompleted: true,
    },
  },
  requests: {
    select: {
      id: true,
      requesterId: true,
      status: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      requester: {
        select: {
          id: true,
          username: true,
          tradesCompleted: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} as const;

