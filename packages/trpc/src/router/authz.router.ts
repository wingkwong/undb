import type { IGetTableRLSSOutput } from '@undb/cqrs'
import {
  CreateRLSCommand,
  DeleteRLSCommand,
  GetTableRLSSQuery,
  UpdateRLSCommand,
  createRLSCommandInput,
  deleteRLSCommandInput,
  getTableRLSSQueryInput,
  updateRLSCommandInput,
} from '@undb/cqrs'
import type { CommandProps, ICommandBus, IQueryBus } from '@undb/domain'
import { z } from 'zod'
import type { publicProcedure } from '../trpc.js'
import { router } from '../trpc.js'

export const createRLSRouter = (procedure: typeof publicProcedure) => (commandBus: ICommandBus, queryBus: IQueryBus) =>
  router({
    list: procedure
      .input(getTableRLSSQueryInput)
      .output(z.any())
      .query<IGetTableRLSSOutput>(({ input }) => {
        const query = new GetTableRLSSQuery(input)
        return queryBus.execute(query)
      }),
    create: procedure
      .input(createRLSCommandInput)
      .output(z.void())
      .mutation(({ input }) => {
        const cmd = new CreateRLSCommand(input as CommandProps<unknown>)
        return commandBus.execute(cmd)
      }),
    update: procedure
      .input(updateRLSCommandInput)
      .output(z.void())
      .mutation(({ input }) => {
        const cmd = new UpdateRLSCommand(input)
        return commandBus.execute(cmd)
      }),
    delete: procedure
      .input(deleteRLSCommandInput)
      .output(z.void())
      .mutation(({ input }) => {
        const cmd = new DeleteRLSCommand(input)
        return commandBus.execute(cmd)
      }),
  })

export const createAuthzRouter =
  (procedure: typeof publicProcedure) => (commandBus: ICommandBus, queryBus: IQueryBus) =>
    router({
      rls: createRLSRouter(procedure)(commandBus, queryBus),
    })
