import { type ChargeRecord, err, failure, ok, type PaymentStore } from "@agentic-personal-finances/core";
import type { PixCharge } from "../../../prisma/generated/client/client";
import { prisma } from "../../config/prisma";

function toCharge(row: PixCharge): ChargeRecord {
	return {
		id: row.id,
		userId: row.userId,
		externalId: row.externalId,
		plan: row.plan,
		amount: row.amount,
		status: row.status,
		expiresAt: row.expiresAt,
		brCode: row.brCode,
		brCodeBase64: row.brCodeBase64,
	};
}

export function createPrismaPaymentStore(): PaymentStore {
	return {
		async createPendingCharge(input) {
			const created = await prisma.pixCharge.create({
				data: {
					userId: input.userId,
					externalId: input.externalId,
					plan: input.plan,
					amount: input.amount,
					status: "pending",
					brCode: input.brCode,
					brCodeBase64: input.brCodeBase64,
					expiresAt: input.expiresAt,
				},
			});
			return ok({ chargeId: created.id });
		},

		async findChargeForUser(chargeId, userId) {
			const row = await prisma.pixCharge.findFirst({ where: { id: chargeId, userId } });
			return ok(row ? toCharge(row) : null);
		},

		async findChargeByExternalId(externalId) {
			const row = await prisma.pixCharge.findUnique({ where: { externalId } });
			return ok(row ? toCharge(row) : null);
		},

		async findChargeById(chargeId) {
			const row = await prisma.pixCharge.findUnique({ where: { id: chargeId } });
			if (!row) return err(failure("not_found", "PIX charge not found"));
			return ok(toCharge(row));
		},

		async setChargeStatus(chargeId, status) {
			await prisma.pixCharge.update({ where: { id: chargeId }, data: { status } });
			return ok(undefined);
		},

		async applyPaidPlan(input) {
			await prisma.$transaction([
				prisma.user.update({
					where: { id: input.userId },
					data: { planStatus: "active", planExpiresAt: input.planExpiresAt },
				}),
				prisma.pixCharge.update({ where: { id: input.chargeId }, data: { status: "paid" } }),
			]);
			return ok(undefined);
		},

		async appendLog(input) {
			await prisma.paymentLog.upsert({
				where: { externalId: input.externalId },
				create: {
					userId: input.userId,
					externalId: input.externalId,
					eventType: input.eventType,
					status: input.status,
					amount: input.amount ?? null,
					currency: "BRL",
					rawPayload: JSON.stringify(input.rawPayload),
				},
				update: { status: input.status, eventType: input.eventType },
			});
			return ok(undefined);
		},

		async listLogs(userId) {
			const rows = await prisma.paymentLog.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
			return ok(
				rows.map((log) => ({
					id: log.id,
					eventType: log.eventType,
					status: log.status,
					amount: log.amount,
					currency: log.currency ?? "BRL",
					createdAt: log.createdAt,
				})),
			);
		},

		async getUserPlan(userId) {
			const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
			return ok({
				planStatus: user.planStatus,
				planExpiresAt: user.planExpiresAt,
			});
		},

		async expireOverduePlans(now) {
			const result = await prisma.user.updateMany({
				where: { planStatus: "active", planExpiresAt: { lt: now } },
				data: { planStatus: "expired" },
			});
			return ok(result.count);
		},
	};
}
