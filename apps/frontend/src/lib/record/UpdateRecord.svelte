<script lang="ts">
	import cx from 'classnames'
	import {
		currentRecordId,
		getRecord,
		getTable,
		getView,
		isShare,
		recordsStore,
		readonlyRecord,
	} from '$lib/store/table'
	import { createMutateRecordValuesSchema } from '@undb/core'
	import { Button, Label, Modal, P, Spinner, Toast } from 'flowbite-svelte'
	import { superForm } from 'sveltekit-superforms/client'
	import { writable } from 'svelte/store'
	import type { Validation } from 'sveltekit-superforms/index'
	import { trpc } from '$lib/trpc/client'
	import CellInput from '$lib/cell/CellInput/CellInput.svelte'
	import FieldIcon from '$lib/field/FieldIcon.svelte'
	import { pick, keys } from 'lodash-es'
	import { slide } from 'svelte/transition'
	import { t } from '$lib/i18n'
	import ReadonlyRecordBadge from '$lib/authz/rls/ReadonlyRecordBadge.svelte'
	import UpdateRecordMenu from './UpdateRecordMenu.svelte'
	import RecordAudits from './RecordAudits.svelte'

	const table = getTable()
	const view = getView()
	const record = getRecord()

	export let data: Validation<any>

	let displayAudits = true
	$: shouldDisplayAudits = displayAudits && !$isShare

	$: validators = createMutateRecordValuesSchema(fields ?? [], $record?.valuesJSON)
	$: fields = $view.getOrderedFields($table.schema.nonSystemFields)

	const updateRecord = trpc().record.update.mutation({
		async onSuccess(data, variables, context) {
			currentRecordId.set(undefined)
		},
	})

	const superFrm = superForm(data, {
		id: 'updateRecord',
		SPA: true,
		applyAction: true,
		validators,
		dataType: 'json',
		invalidateAll: false,
		resetForm: true,
		clearOnSubmit: 'errors-and-message',
		taintedMessage: null,
		delayMs: 100,
		async onUpdate(event) {
			if ($readonlyRecord) return
			if (!$record) return
			const taintedKeys = keys($tainted)
			const values = pick(event.form.data, taintedKeys)
			$updateRecord.mutate({
				tableId: $table.id.value,
				id: $record.id.value,
				values,
			})
		},
	})

	const { form, enhance, delayed, tainted, submitting } = superFrm

	const open = writable<boolean>(false)
	$: {
		open.set(!!$currentRecordId)
	}
	$: if (!$open) {
		currentRecordId.set(undefined)
	}

	const prevRecord = recordsStore.prevRecord
	const nextRecord = recordsStore.nextRecord
</script>

{#key $record}
	<Modal class="w-full h-[calc(100vh-64px)]" size="xl" bind:open={$open} outsideclose>
		<svelte:fragment slot="header">
			<div class="flex items-center w-full justify-between mr-6">
				<div class="flex items-center space-x-4">
					<P>{$t('Update Record')}</P>
					{#if $record}
						<ReadonlyRecordBadge />
					{/if}
					<!-- <ButtonGroup size="xs">
						<Button size="xs" disabled={!$prevRecord} on:click={() => ($currentRecordId = $prevRecord?.id.value)}>
							<i class="ti ti-chevron-left text-gray-500 text-base" />
						</Button>
						<Button size="xs" disabled={!$nextRecord} on:click={() => ($currentRecordId = $nextRecord?.id.value)}>
							<i class="ti ti-chevron-right text-gray-500 text-base" />
						</Button>
					</ButtonGroup> -->
				</div>

				<div class="flex items-center gap-2">
					{#if !$isShare}
						<button on:click={() => (displayAudits = !displayAudits)}>
							<i class="ti ti-history"></i>
						</button>
					{/if}
					<UpdateRecordMenu record={$record} />
				</div>
			</div>
		</svelte:fragment>

		<svelte:fragment>
			<div class="h-[calc(100%+48px)] -m-6">
				{#if !$record}
					<div
						class="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-50 z-50 flex items-center justify-center"
					>
						<Spinner />
					</div>
				{/if}

				<div class="grid grid-cols-6 h-full">
					<div
						class={cx(
							'p-6 border-r dark:border-r-slate-900 h-full overflow-y-auto',
							shouldDisplayAudits ? 'col-span-4' : 'col-span-6',
						)}
					>
						<form id="updateRecord" class="space-y-5" method="POST" use:enhance>
							<div class="grid grid-cols-5 gap-x-3 gap-y-4 items-center">
								{#each fields as field}
									<div class="h-full items-start gap-1 pt-2">
										<Label class="leading-5" for={field.id.value}>
											<div class="inline-flex items-center gap-2 truncate w-full">
												<FieldIcon type={field.type} size={16} />
												<span class="truncate flex-1" title={field.name.value}>
													{field.name.value}
												</span>
											</div>
											{#if field.required}
												<span class="text-red-500">*</span>
											{/if}
										</Label>
									</div>
									<div class="col-span-4">
										<CellInput
											record={$record}
											{field}
											bind:value={$form[field.id.value]}
											readonly={$readonlyRecord ? true : undefined}
										/>
									</div>
								{/each}
							</div>
						</form>
					</div>
					{#if shouldDisplayAudits}
						<div class="col-span-2 px-2 py-6 h-full overflow-y-auto bg-slate-50 dark:bg-slate-700">
							<RecordAudits />
						</div>
					{/if}
				</div>
			</div>
		</svelte:fragment>

		<svelte:fragment slot="footer">
			<div class="w-full flex justify-end gap-2">
				<Button color="alternative" on:click={() => ($currentRecordId = undefined)}>
					{$t('Cancel', { ns: 'common' })}
				</Button>
				<Button class="gap-2" type="submit" form="updateRecord" disabled={$submitting || $readonlyRecord}>
					{#if $delayed}
						<Spinner size="5" />
					{:else}
						<i class="ti ti-edit" />
					{/if}
					{$t('Update Record')}</Button
				>
			</div>
		</svelte:fragment>
	</Modal>
{/key}

{#if $updateRecord.error}
	<Toast transition={slide} position="bottom-right" class="z-[99999] !bg-red-500 border-0 text-white font-semibold">
		<span class="inline-flex items-center gap-3">
			<i class="ti ti-exclamation-circle text-lg" />
			{$updateRecord.error.message}
		</span>
	</Toast>
{/if}
