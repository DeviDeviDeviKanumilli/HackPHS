import type { Trade, TradeRequest, User } from '@prisma/client';

type MinimalUser = Pick<User, 'id' | 'username' | 'tradesCompleted'>;

type TradeRequestWithRequester = TradeRequest & {
  requester: MinimalUser;
};

export type TradeWithRelations = Trade & {
  owner: MinimalUser;
  counterparty: MinimalUser | null;
  requests: TradeRequestWithRequester[];
};

interface FormatTradeOptions {
  currentUserId?: string | null;
  distance?: number | null;
}

export function formatTradeResponse(
  trade: TradeWithRelations,
  options: FormatTradeOptions = {}
) {
  const { currentUserId, distance } = options;

  const owner = {
    _id: trade.owner.id,
    username: trade.owner.username,
    tradesCompleted: trade.owner.tradesCompleted,
  };

  const counterparty = trade.counterparty
    ? {
        _id: trade.counterparty.id,
        username: trade.counterparty.username,
        tradesCompleted: trade.counterparty.tradesCompleted,
      }
    : null;

  const requests = trade.requests.map((request) => ({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    requesterId: request.requesterId,
    message: request.message ?? null,
    requester: {
      _id: request.requester.id,
      username: request.requester.username,
      tradesCompleted: request.requester.tradesCompleted,
    },
  }));

  const userRequest = currentUserId
    ? requests.find((request) => request.requesterId === currentUserId)
    : null;

  const isOwner = currentUserId ? trade.ownerId === currentUserId : false;
  const counterpartyId = trade.counterpartyId ?? null;
  const isCounterparty = currentUserId ? (counterpartyId === currentUserId) : false;

  const canRequest = currentUserId
    ? !isOwner && trade.status === 'active' && (!userRequest || userRequest.status === 'cancelled')
    : false;

  return {
    id: trade.id,
    _id: trade.id,
    ownerId: owner,
    offeredItem: trade.offeredItem,
    requestedItem: trade.requestedItem,
    locationZip: trade.locationZip,
    latitude: trade.latitude,
    longitude: trade.longitude,
    status: trade.status,
    offeredPlantId: trade.offeredPlantId,
    requestedPlantId: trade.requestedPlantId,
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
    coordinates: {
      lat: trade.latitude,
      lng: trade.longitude,
    },
    owner,
    counterparty,
    counterpartyId: trade.counterpartyId ?? null,
    requests,
    userRequestStatus: userRequest?.status ?? null,
    userRequestId: userRequest?.id ?? null,
    canRequest,
    isOwner,
    isCounterparty,
    distance: distance ?? undefined,
  };
}

