'use client'

import type { Table as CoreTable, QueryRecords } from '@egodb/core'
import { EGOTable } from '../../../components/table-ui/table'
import { Stack } from '@egodb/ui'
import { CreateFieldModal } from '../../../components/create-field-form/create-field-modal'
import { CreateRecordFormDrawer } from '../../../components/create-record-form/create-record-form-drawer'
import { EditRecordFormDrawer } from '../../../components/edit-record-form/edit-record-form-drawer'
import { TableHaeder } from '../../../components/table/table-header'
import { TableToolbar } from '../../../components/table/table-toolbar'

interface IProps {
  table: CoreTable
  records: QueryRecords
}

export default function Table({ table, records }: IProps) {
  return (
    <Stack>
      <Stack px="md" pt="sm">
        <TableHaeder table={table} />
        <TableToolbar table={table} />
      </Stack>
      <EGOTable table={table} records={records} />
      <CreateRecordFormDrawer table={table} />
      <EditRecordFormDrawer table={table} />
      <CreateFieldModal table={table} />
    </Stack>
  )
}
