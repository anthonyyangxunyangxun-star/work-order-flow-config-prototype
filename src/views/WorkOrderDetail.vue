<template>
  <main class="detail-page">
    <section class="detail-header">
      <div class="detail-title-group">
        <m-button type="link" @click="goBack">{{ tx('返回列表') }}</m-button>
        <div>
          <h2 class="page-title">{{ order.title }}</h2>
          <p>{{ order.orderNo }} · {{ workTypeLabel(order.workType) }} · {{ order.classification }}</p>
        </div>
      </div>
      <div v-if="isWorkRecordDetail" class="detail-actions">
        <m-button type="default" @click="handleMoreAction">{{ tx('作废') }}</m-button>
        <m-button type="default" @click="handleMoreAction">{{ tx('终止') }}</m-button>
        <m-dropdown model-value="" :options="localizeOptions(recordMoreOptions)" :text="tx('更多')" trigger="click" @optionClick="handleMoreAction" />
      </div>
      <div v-else class="detail-actions">
        <m-dropdown model-value="" :options="localizeOptions(moreOptions)" :text="tx('更多')" trigger="click" @optionClick="handleMoreAction" />
      </div>
    </section>

    <section v-if="!isWorkRecordDetail" class="detail-summary">
      <article v-for="item in summaryItems" :key="item.label">
        <span>{{ tx(item.label) }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="detail-main" :class="{ 'detail-main--inspection': isWorkRecordDetail }">
      <div class="detail-content-panel">
        <template v-if="isWorkRecordDetail">
          <div class="inspection-page-body">
            <div class="inspection-overview">
              <section class="inspection-block inspection-block--base">
                <SectionTitle :title="tx('基础信息')" />
                <div class="inspection-info-grid">
                  <article v-for="item in recordSummaryFields" :key="item.label">
                    <span>{{ tx(item.label) }}</span>
                    <strong>{{ item.value }}</strong>
                  </article>
                </div>
              </section>

              <section class="inspection-block">
                <SectionTitle :title="tx('当前进展')" />
                <div class="metric-strip">
                  <article v-for="metric in recordProgressMetrics" :key="metric.label" :class="`metric-card metric-card--${metric.tone}`">
                    <span>{{ tx(metric.label) }}</span>
                    <strong>{{ tx(metric.value) }}</strong>
                    <em>{{ tx(metric.note) }}</em>
                  </article>
                </div>
              </section>
            </div>

            <section class="inspection-block inspection-tab-panel">
              <m-tabs v-model="recordTab" :data="localizeOptions(recordTabs)" size="large" />

              <div v-if="isEngineeringChangeDetail && activeRecordTab === 'demand'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('需求来源信息') }}</strong>
                      <span>{{ tx('展示改造需求来源、申请人和上游关联单据。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringDemandSourceFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('改造对象信息') }}</strong>
                      <span>{{ tx('按规格书只保留改造对象和改造范围，不再单独放空间/设备位置摘要。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringTargetFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('需求描述') }}</strong>
                      <span>{{ tx('现状问题、改造目标和期望完成时间。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact inspection-info-grid--wide">
                      <article v-for="item in engineeringDemandDescFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('附件') }}</strong>
                      <span>{{ tx('需求相关附件。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringAttachmentColumns)" :dataSource="engineeringDetail.demand.attachments" rowKey="id" evenColor />
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'survey'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('勘查信息') }}</strong>
                      <span>{{ tx('若节点未启用，前端展示未启用状态。') }}</span>
                    </div>
                    <div v-if="engineeringDetail.survey.enabled" class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringSurveyFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                    <div v-else class="state-inline">{{ tx('本单未启用现场勘查') }}</div>
                  </section>
                  <template v-if="engineeringDetail.survey.enabled">
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('影响评估') }}</strong>
                        <span>{{ tx('影响范围、系统、区域和商户。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringImpactFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('风险评估') }}</strong>
                        <span>{{ tx('施工安全、停机断电和施工限制。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact inspection-info-grid--wide">
                        <article v-for="item in engineeringRiskFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('现场照片') }}</strong>
                        <span>{{ tx('现场勘查照片列表。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringPhotoColumns)" :dataSource="engineeringDetail.survey.photos" rowKey="id" evenColor>
                          <template #photo="row">
                            <div class="thumbnail-list">
                              <div class="photo-thumb">
                                <img :src="attachmentThumb(row.photoName)" :alt="row.photoName" />
                                <span>{{ row.photoName }}</span>
                              </div>
                            </div>
                          </template>
                        </m-table>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('评估结论') }}</strong>
                        <span>{{ tx('是否具备施工条件。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringSurveyConclusionFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                  </template>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'plan'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('方案基础信息') }}</strong>
                      <span>{{ tx('方案名称、概述、版本和审批状态。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringPlanBaseFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('时间要求') }}</strong>
                      <span>{{ tx('计划时间和可施工窗口。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringPlanTimeFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('事项列表') }}</strong>
                      <span>{{ tx('每个事项包含事项描述、事项说明和执行对象。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringPlanItemColumns)" :dataSource="engineeringDetail.plan.items" rowKey="id" evenColor>
                        <template #executionObjects="row">
                          <m-button type="link" size="small" @click="openStrategyObjects(row)">{{ tx('{count} 个对象', { count: row.objectCount }) }}</m-button>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('预算摘要') }}</strong>
                      <span>{{ tx('详细成本计划在成本页签查看。') }}</span>
                    </div>
                    <div class="cost-summary-grid cost-summary-grid--three">
                      <article v-for="item in engineeringPlanBudgetItems" :key="item.label" class="cost-summary-card">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                        <em>{{ tx(item.note) }}</em>
                      </article>
                    </div>
                    <m-button type="link" @click="recordTab = 'cost'">{{ tx('查看成本明细') }}</m-button>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('方案附件') }}</strong>
                      <span>{{ tx('方案、图纸、选型报告和现场照片包。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringAttachmentColumnsWithUploader)" :dataSource="engineeringDetail.plan.attachments" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('安全措施与停机安排') }}</strong>
                      <span>{{ tx('施工前置要求和验收标准摘要。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact inspection-info-grid--wide">
                      <article v-for="item in engineeringPlanSafetyFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'engineeringExecution'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('执行主体信息') }}</strong>
                      <span>{{ tx('人员、班组、供应商和实际工期。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringExecutionBaseFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('施工记录') }}</strong>
                      <span>{{ tx('按施工日期展示过程记录。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringConstructionRecordColumns)" :dataSource="engineeringDetail.execution.constructionRecords" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('进度记录') }}</strong>
                      <span>{{ tx('事项完成比例和总体进度。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringProgressRecordColumns)" :dataSource="engineeringDetail.execution.progressRecords" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('现场照片') }}</strong>
                      <span>{{ tx('施工前、中、后的照片留痕。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringConstructionPhotoColumns)" :dataSource="engineeringDetail.execution.photos" rowKey="id" evenColor>
                        <template #photo="row">
                          <div class="thumbnail-list">
                            <div class="photo-thumb">
                              <img :src="attachmentThumb(row.photoName, row.stage === '施工后' ? 'after' : 'default')" :alt="row.photoName" />
                              <span>{{ row.stage }}</span>
                            </div>
                          </div>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('问题记录') }}</strong>
                      <span>{{ tx('施工过程发现的问题和处理状态。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringProblemColumns)" :dataSource="engineeringDetail.execution.problemRecords" rowKey="id" evenColor>
                        <template #status="row">
                          <m-tag :type="statusTextTagType(row.status)">{{ tx(row.status) }}</m-tag>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('变更记录') }}</strong>
                      <span>{{ tx('方案变更内容、原因和审批结果。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringChangeColumns)" :dataSource="engineeringDetail.execution.changeRecords" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('安全措施执行情况') }}</strong>
                      <span>{{ tx('按安全措施逐项记录执行情况。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringSafetyColumns)" :dataSource="engineeringDetail.execution.safetyExecution" rowKey="id" evenColor>
                        <template #status="row">
                          <m-tag :type="statusTextTagType(row.status)">{{ tx(row.status) }}</m-tag>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('实际资源使用') }}</strong>
                      <span>{{ tx('实际人力、物料和机械使用。') }}</span>
                    </div>
                    <div class="inspection-table-grid inspection-table-grid--dual">
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringActualLaborColumns)" :dataSource="engineeringDetail.execution.actualLabor" rowKey="id" evenColor />
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringActualMaterialColumns)" :dataSource="engineeringDetail.execution.actualMaterial" rowKey="id" evenColor />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'acceptance'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('验收信息') }}</strong>
                      <span>{{ tx('若验收节点未启用，展示未启用状态。') }}</span>
                    </div>
                    <div v-if="engineeringDetail.acceptance.enabled" class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringAcceptanceBaseFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                    <div v-else class="state-inline">{{ tx('本单未启用改造验收') }}</div>
                  </section>
                  <template v-if="engineeringDetail.acceptance.enabled">
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('验收标准') }}</strong>
                        <span>{{ tx('按标准项记录验收结果。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringAcceptanceCriteriaColumns)" :dataSource="engineeringDetail.acceptance.criteria" rowKey="id" evenColor>
                          <template #result="row">
                            <m-tag :type="statusTextTagType(row.result)">{{ tx(row.result) }}</m-tag>
                          </template>
                        </m-table>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('验收结论') }}</strong>
                        <span>{{ tx('整体验收结论和说明。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringAcceptanceResultFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('整改要求') }}</strong>
                        <span>{{ tx('需要整改的事项、期限和责任人。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringRectificationColumns)" :dataSource="engineeringDetail.acceptance.rectificationRequirements" rowKey="id" evenColor>
                          <template #status="row">
                            <m-tag :type="statusTextTagType(row.status)">{{ tx(row.status) }}</m-tag>
                          </template>
                        </m-table>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('复验记录') }}</strong>
                        <span>{{ tx('整改后的复验结论。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringRecheckColumns)" :dataSource="engineeringDetail.acceptance.recheckRecords" rowKey="id" evenColor />
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('验收照片') }}</strong>
                        <span>{{ tx('验收现场照片。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringAcceptancePhotoColumns)" :dataSource="engineeringDetail.acceptance.photos" rowKey="id" evenColor>
                          <template #photo="row">
                            <div class="thumbnail-list">
                              <div class="photo-thumb photo-thumb--after">
                                <img :src="attachmentThumb(row.photoName, 'after')" :alt="row.photoName" />
                                <span>{{ row.photoName }}</span>
                              </div>
                            </div>
                          </template>
                        </m-table>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('签字确认记录') }}</strong>
                        <span>{{ tx('签字人、角色、意见和电子签名。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringSignatureColumns)" :dataSource="engineeringDetail.acceptance.signatureRecords" rowKey="id" evenColor />
                      </div>
                    </section>
                  </template>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'cost'" class="inspection-tab-body">
                <div class="cost-summary-grid">
                  <article v-for="item in engineeringCostSummaryItems" :key="item.label" class="cost-summary-card">
                    <span>{{ tx(item.label) }}</span>
                    <strong>{{ item.value }}</strong>
                    <em>{{ tx(item.note) }}</em>
                  </article>
                </div>
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('成本汇总对比') }}</strong>
                      <span>{{ tx('按费用类别展示预算、实际、差异和差异原因。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringCostCategoryColumns)" :dataSource="engineeringDetail.cost.categoryCosts" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('人力成本对比') }}</strong>
                      <span>{{ tx('计划工时和实际工时对比。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringLaborCostColumns)" :dataSource="engineeringDetail.cost.laborCosts" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('物料成本对比') }}</strong>
                      <span>{{ tx('物料计划数量、实际数量和金额差异。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringMaterialCostColumns)" :dataSource="engineeringDetail.cost.materialCosts" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('外委费用对比') }}</strong>
                      <span>{{ tx('供应商、合同和付款状态。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringOutsourcingCostColumns)" :dataSource="engineeringDetail.cost.outsourcingFees" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('其他费用对比') }}</strong>
                      <span>{{ tx('垃圾清运、成品保护等费用。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringOtherFeeColumns)" :dataSource="engineeringDetail.cost.otherFees" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('成本归集过程') }}</strong>
                      <span>{{ tx('物料领用记录和工时记录。') }}</span>
                    </div>
                    <div class="inspection-table-grid inspection-table-grid--dual">
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringMaterialReqColumns)" :dataSource="engineeringDetail.cost.materialRequests" rowKey="id" evenColor />
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringWorkHourColumns)" :dataSource="engineeringDetail.cost.workHourRecords" rowKey="id" evenColor />
                      </div>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('合同与付款') }}</strong>
                      <span>{{ tx('外委合同、付款节点和发票状态。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringContractFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                    <div class="table-wrap engineering-inline-table">
                      <m-table :columns="localizeColumns(engineeringPaymentColumns)" :dataSource="engineeringDetail.cost.paymentMilestones" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('结算状态') }}</strong>
                      <span>{{ tx('费用结算、成本归集和 ERP 同步状态。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in engineeringSettlementFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'archive'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('台账更新部分') }}</strong>
                      <span>{{ tx(engineeringDetail.archive.ledgerEnabled ? '系统数据同步记录' : '无台账资料更新') }}</span>
                    </div>
                    <template v-if="engineeringDetail.archive.ledgerEnabled">
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringAffectedObjectColumns)" :dataSource="engineeringDetail.archive.affectedObjects" rowKey="id" evenColor />
                      </div>
                    </template>
                    <div v-else class="state-inline">{{ tx('无台账资料更新') }}</div>
                  </section>
                  <template v-if="engineeringDetail.archive.ledgerEnabled">
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('更新内容') }}</strong>
                        <span>{{ tx('更新前后内容对比。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringUpdateContentColumns)" :dataSource="engineeringDetail.archive.updateContents" rowKey="id" evenColor />
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('更新信息') }}</strong>
                        <span>{{ tx('更新人、更新时间和结果。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringUpdateFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('更新附件') }}</strong>
                        <span>{{ tx('台账更新相关附件。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(engineeringUpdateAttachmentColumns)" :dataSource="engineeringDetail.archive.updateAttachments" rowKey="id" evenColor />
                      </div>
                    </section>
                  </template>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('竣工归档部分') }}</strong>
                      <span>{{ tx(engineeringDetail.archive.archiveReady ? '竣工资料交付与存档' : '待验收通过后进入竣工归档') }}</span>
                    </div>
                    <div v-if="engineeringDetail.archive.archiveReady" class="table-wrap">
                      <m-table :columns="localizeColumns(engineeringArchiveDocColumns)" :dataSource="engineeringDetail.archive.archiveDocs" rowKey="id" evenColor>
                        <template #archiveStatus="row">
                          <m-tag :type="statusTextTagType(row.archiveStatus)">{{ tx(row.archiveStatus) }}</m-tag>
                        </template>
                      </m-table>
                    </div>
                    <div v-else class="state-inline">{{ tx('待验收通过后进入竣工归档') }}</div>
                  </section>
                  <template v-if="engineeringDetail.archive.archiveReady">
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('归档移交记录') }}</strong>
                        <span>{{ tx('施工方移交和甲方接收信息。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringHandoverFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('归档完整性') }}</strong>
                        <span>{{ tx('必归资料数量、完成率和缺失说明。') }}</span>
                      </div>
                      <div class="inspection-info-grid inspection-info-grid--compact">
                        <article v-for="item in engineeringArchiveCompletenessFields" :key="item.label">
                          <span>{{ tx(item.label) }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>
                  </template>
                </div>
              </div>

              <div v-else-if="isEngineeringChangeDetail && activeRecordTab === 'flow'" class="inspection-tab-body">
                <section class="inspection-subsection inspection-subsection--no-top">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx('流程节点列表') }}</strong>
                    <span>{{ tx('按工程改造流程配置展示节点轨迹。') }}</span>
                  </div>
                  <div class="table-wrap">
                    <m-table :columns="localizeColumns(engineeringFlowColumns)" :dataSource="engineeringDetail.workflowRecords" rowKey="id" evenColor>
                      <template #nodeStatus="row">
                        <m-tag :type="statusTextTagType(row.nodeStatus)">{{ tx(row.nodeStatus) }}</m-tag>
                      </template>
                    </m-table>
                  </div>
                </section>
              </div>

              <div v-else-if="isRepairDetail && activeRecordTab === 'fault'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('故障来源与影响') }}</strong>
                      <span>{{ tx('承接报事、巡检、维保或人工创建来源，记录故障对象、现象和风险。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in repairFaultFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('故障照片') }}</strong>
                      <span>{{ tx('报事或应急维修来源建议保留现场照片。') }}</span>
                    </div>
                    <div v-if="recordDetail.fault.photos?.length" class="thumbnail-list thumbnail-list--wide">
                      <div v-for="item in recordDetail.fault.photos" :key="item" class="photo-thumb">
                        <img :src="attachmentThumb(item)" :alt="item" />
                        <span>{{ item }}</span>
                      </div>
                    </div>
                    <div v-else class="state-inline">{{ tx('暂无故障照片') }}</div>
                  </section>
                </div>
              </div>

              <div v-else-if="isRepairDetail && activeRecordTab === 'diagnosis'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('异常核实') }}</strong>
                      <span>{{ tx('确认故障真实性、影响范围和紧急程度。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in repairVerifyFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('诊断排查') }}</strong>
                      <span>{{ tx('记录故障原因、处理路径、外委与待料判断。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact inspection-info-grid--wide">
                      <article v-for="item in repairDiagnosisFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('诊断附件') }}</strong>
                      <span>{{ tx('检测记录、仪表读数或排查照片。') }}</span>
                    </div>
                    <div v-if="recordDetail.diagnosis.attachments?.length" class="table-wrap">
                      <m-table :columns="localizeColumns(simpleAttachmentColumns)" :dataSource="recordDetail.diagnosis.attachments" rowKey="id" evenColor />
                    </div>
                    <div v-else class="state-inline">{{ tx('暂无诊断附件') }}</div>
                  </section>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'checkIn'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('打卡记录') }}</strong>
                      <span>{{ tx('按打卡时间升序展示，每次打卡的照片随记录展示。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(checkInRecordColumns)" :dataSource="recordDetail.checkInRecords" rowKey="id" evenColor>
                        <template #attachment="row">
                          <div v-if="row.attachments?.length" class="thumbnail-list">
                            <div v-for="item in row.attachments" :key="item" class="photo-thumb">
                              <img :src="attachmentThumb(item)" :alt="item" />
                              <span>{{ item }}</span>
                            </div>
                          </div>
                          <span v-else>-</span>
                        </template>
                      </m-table>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'execution'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('检查记录') }}</strong>
                      <span>{{ tx('展示策略事项检查结果、现场选择项和异常照片。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(inspectionRecordColumns)" :dataSource="recordDetail.executionRecords.inspections" rowKey="id" evenColor>
                        <template #resultCategory="row">
                          <m-tag :type="resultTagType(row.resultCategory)">{{ tx(row.resultCategory) }}</m-tag>
                        </template>
                        <template #photo="row">
                          <div v-if="row.photos?.length" class="thumbnail-list">
                            <div v-for="item in row.photos" :key="item" class="photo-thumb">
                              <img :src="attachmentThumb(item)" :alt="item" />
                              <span>{{ item }}</span>
                            </div>
                          </div>
                          <span v-else>-</span>
                        </template>
                      </m-table>
                    </div>
                  </section>

                  <section v-if="executionRepairRecords.length" class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx(isMaintenanceDetail ? '维保作业记录' : '维修记录') }}</strong>
                      <span>{{ tx(isMaintenanceDetail ? '维保执行中产生的清洁、润滑、更换、调整或维修作业记录。' : '执行中产生的维修类事项记录，字段口径与检查记录保持一致。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(inspectionRecordColumns)" :dataSource="executionRepairRecords" rowKey="id" evenColor>
                        <template #resultCategory="row">
                          <m-tag :type="resultTagType(row.resultCategory)">{{ tx(row.resultCategory) }}</m-tag>
                        </template>
                        <template #photo="row">
                          <div v-if="row.photos?.length" class="thumbnail-list">
                            <div v-for="item in row.photos" :key="item" class="photo-thumb">
                              <img :src="attachmentThumb(item)" :alt="item" />
                              <span>{{ item }}</span>
                            </div>
                          </div>
                          <span v-else>-</span>
                        </template>
                      </m-table>
                    </div>
                  </section>

                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('抄录记录') }}</strong>
                      <span>{{ tx('按抄录时间升序展示设备点位的数值结果。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(meterReadingColumns)" :dataSource="recordDetail.executionRecords.meterReadings" rowKey="id" evenColor>
                        <template #readingResult="row">
                          <strong>{{ row.value }} {{ row.unit }}</strong>
                        </template>
                      </m-table>
                    </div>
                  </section>

                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('无法执行记录') }}</strong>
                      <span>{{ tx('展示无法执行的实例、策略事项和原因说明。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(unableRecordColumns)" :dataSource="recordDetail.unableRecords" rowKey="id" evenColor />
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="isRepairDetail && activeRecordTab === 'repairExecution'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('维修处理记录') }}</strong>
                      <span>{{ tx('记录执行人、维修对象、处理措施和处理结果。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(repairExecutionRecordColumns)" :dataSource="recordDetail.repairExecution.records" rowKey="id" evenColor>
                        <template #repairResult="row">
                          <m-tag :type="statusTextTagType(row.repairResult)">{{ tx(row.repairResult) }}</m-tag>
                        </template>
                        <template #photo="row">
                          <div v-if="row.photos?.length" class="thumbnail-list">
                            <div v-for="item in row.photos" :key="item" class="photo-thumb">
                              <img :src="attachmentThumb(item)" :alt="item" />
                              <span>{{ item }}</span>
                            </div>
                          </div>
                          <span v-else>-</span>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('实际资源使用') }}</strong>
                      <span>{{ tx('区分实际人力、物料工具和外委服务，工具归还不计消耗成本。') }}</span>
                    </div>
                    <div class="inspection-table-grid inspection-table-grid--three">
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(actualLaborColumns)" :dataSource="recordDetail.repairExecution.actualLabor" rowKey="id" evenColor />
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(actualMaterialColumns)" :dataSource="actualMaterialAndToolRecords" rowKey="id" evenColor />
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(outsourcingRecordColumns)" :dataSource="recordDetail.repairExecution.outsourcingRecords" rowKey="id" evenColor />
                      </div>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('恢复验证') }}</strong>
                      <span>{{ tx('维修执行必须形成恢复验证结果后才能进入验收。') }}</span>
                    </div>
                    <div class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in recoveryVerificationFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'maintenanceAcceptance' || activeRecordTab === 'repairAcceptance'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx(isRepairDetail ? '维修验收信息' : '维保验收信息') }}</strong>
                      <span>{{ tx(isRepairDetail ? '确认维修恢复结果、返工要求和关闭意见。' : '验收维保结果、确认整改或关闭。') }}</span>
                    </div>
                    <div v-if="recordDetail.acceptance.enabled" class="inspection-info-grid inspection-info-grid--compact">
                      <article v-for="item in acceptanceBaseFields" :key="item.label">
                        <span>{{ tx(item.label) }}</span>
                        <strong>{{ item.value }}</strong>
                      </article>
                    </div>
                    <div v-else class="state-inline">{{ tx('本单未启用验收记录') }}</div>
                  </section>
                  <template v-if="recordDetail.acceptance.enabled">
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('验收标准') }}</strong>
                        <span>{{ tx('按标准项逐项记录验收结果和说明。') }}</span>
                      </div>
                      <div class="table-wrap">
                        <m-table :columns="localizeColumns(acceptanceCriteriaColumns)" :dataSource="recordDetail.acceptance.criteria" rowKey="id" evenColor>
                          <template #result="row">
                            <m-tag :type="statusTextTagType(row.result)">{{ tx(row.result) }}</m-tag>
                          </template>
                        </m-table>
                      </div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx(isRepairDetail ? '返工要求' : '整改要求') }}</strong>
                        <span>{{ tx('验收不通过或有条件通过时展示。') }}</span>
                      </div>
                      <div v-if="acceptanceRequirementRecords.length" class="table-wrap">
                        <m-table :columns="localizeColumns(acceptanceRequirementColumns)" :dataSource="acceptanceRequirementRecords" rowKey="id" evenColor>
                          <template #status="row">
                            <m-tag :type="statusTextTagType(row.status)">{{ tx(row.status) }}</m-tag>
                          </template>
                        </m-table>
                      </div>
                      <div v-else class="state-inline">{{ tx('暂无整改或返工要求') }}</div>
                    </section>
                    <section v-if="isRepairDetail" class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('复验记录') }}</strong>
                        <span>{{ tx('返工后复验时展示。') }}</span>
                      </div>
                      <div v-if="recordDetail.acceptance.recheckRecords?.length" class="table-wrap">
                        <m-table :columns="localizeColumns(recheckRecordColumns)" :dataSource="recordDetail.acceptance.recheckRecords" rowKey="id" evenColor />
                      </div>
                      <div v-else class="state-inline">{{ tx('暂无复验记录') }}</div>
                    </section>
                    <section v-if="isMaintenanceDetail" class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('服务报告') }}</strong>
                        <span>{{ tx('外委、法检、强检时展示服务或检测报告。') }}</span>
                      </div>
                      <div v-if="recordDetail.acceptance.serviceReports?.length" class="table-wrap">
                        <m-table :columns="localizeColumns(simpleAttachmentColumns)" :dataSource="recordDetail.acceptance.serviceReports" rowKey="id" evenColor />
                      </div>
                      <div v-else class="state-inline">{{ tx('暂无服务报告') }}</div>
                    </section>
                    <section class="inspection-subsection">
                      <div class="inspection-subsection-head">
                        <strong>{{ tx('签字记录') }}</strong>
                        <span>{{ tx('需要电子签名时展示签字意见。') }}</span>
                      </div>
                      <div v-if="recordDetail.acceptance.signatureRecords?.length" class="table-wrap">
                        <m-table :columns="localizeColumns(signatureRecordColumns)" :dataSource="recordDetail.acceptance.signatureRecords" rowKey="id" evenColor />
                      </div>
                      <div v-else class="state-inline">{{ tx('暂无签字记录') }}</div>
                    </section>
                  </template>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'problemRepair'" class="inspection-tab-body">
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('问题与维修记录') }}</strong>
                      <span>{{ tx('现场自修直接展示措施和前后照片，转维修展示关联维修单。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(problemRepairColumns)" :dataSource="recordDetail.problemAndRepairRecords" rowKey="id" evenColor>
                        <template #problemStatus="row">
                          <m-tag :type="row.problemStatus === '已自修' ? 'completed' : 'processing'">{{ tx(row.problemStatus) }}</m-tag>
                        </template>
                        <template #repairRecord="row">
                          <div v-if="row.repairMode === '自修'" class="repair-cell">
                            <strong>{{ row.repairUser }} / {{ row.repairTime }}</strong>
                            <span>{{ row.repairMeasure }}</span>
                            <div class="repair-photo-row">
                              <div class="thumbnail-list">
                                <div v-for="item in row.beforePhotos" :key="item" class="photo-thumb">
                                  <img :src="attachmentThumb(item)" :alt="item" />
                                  <span>{{ item }}</span>
                                </div>
                              </div>
                              <div class="thumbnail-list">
                                <div v-for="item in row.afterPhotos" :key="item" class="photo-thumb photo-thumb--after">
                                  <img :src="attachmentThumb(item, 'after')" :alt="item" />
                                  <span>{{ item }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <m-button v-else type="link" size="small">{{ row.repairOrderNo }}</m-button>
                        </template>
                      </m-table>
                    </div>
                  </section>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'flow'" class="inspection-tab-body">
                <section v-if="isInspectionDetail || isMaintenanceDetail || isRepairDetail" class="inspection-subsection inspection-subsection--no-top">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx('流程节点列表') }}</strong>
                    <span>{{ tx(workflowTableHint) }}</span>
                  </div>
                  <div class="table-wrap">
                    <m-table :columns="localizeColumns(workRecordFlowColumns)" :dataSource="recordDetail.workflowRecords" rowKey="id" evenColor>
                      <template #nodeStatus="row">
                        <m-tag :type="statusTextTagType(row.nodeStatus || row.status)">{{ tx(row.nodeStatus || row.status) }}</m-tag>
                      </template>
                    </m-table>
                  </div>
                </section>
                <div v-else class="inspection-flow-timeline">
                  <article v-for="record in recordDetail.workflowRecords" :key="record.id" class="inspection-flow-item" :class="{ 'inspection-flow-item--active': record.active }">
                    <span class="inspection-flow-dot"></span>
                    <div>
                      <div class="inspection-flow-head">
                        <strong>{{ record.node }}</strong>
                        <m-tag :type="record.tagType">{{ tx(record.status) }}</m-tag>
                      </div>
                      <p>{{ record.desc }}</p>
                      <div class="inspection-flow-meta">
                        <span>{{ record.time }}</span>
                        <span>{{ record.operator }}</span>
                        <span v-if="record.approvalOrder">{{ tx('审批单：{order} / {status}', { order: record.approvalOrder, status: tx(record.approvalStatus) }) }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'plan'" class="inspection-tab-body">
                <section class="inspection-subsection inspection-subsection--no-top">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx(planBaseTitle) }}</strong>
                    <span>{{ tx(planBaseHint) }}</span>
                  </div>
                  <div class="inspection-info-grid inspection-info-grid--compact">
                    <article v-for="item in recordPlanBaseFields" :key="item.label">
                      <span>{{ tx(item.label) }}</span>
                      <strong>{{ item.value }}</strong>
                    </article>
                  </div>
                </section>
                <section class="inspection-subsection">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx('时间要求') }}</strong>
                    <span>{{ tx(isRepairDetail ? '维修方案要求时间、停机窗口、风险措施和验收标准。' : '当前单据应在要求开始和结束时间内完成。') }}</span>
                  </div>
                  <div class="inspection-info-grid inspection-info-grid--compact">
                    <article v-for="item in recordPlanTimeFields" :key="item.label">
                      <span>{{ tx(item.label) }}</span>
                      <strong>{{ item.value }}</strong>
                    </article>
                  </div>
                </section>
                <section class="inspection-subsection">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx(strategySectionTitle) }}</strong>
                    <span>{{ tx('执行对象为统计数据，点击数量查看对象明细。') }}</span>
                  </div>
                  <div class="table-wrap">
                    <m-table :columns="localizeColumns(strategyItemColumns)" :dataSource="recordDetail.sourcePlan.strategyItems" rowKey="id" evenColor>
                      <template #type="row">
                        <m-tag :type="row.type === '维修' ? 'rejected' : 'processing'">{{ tx(row.type) }}</m-tag>
                      </template>
                      <template #objectTypes="row">
                        <span>{{ strategyObjectTypes(row) }}</span>
                      </template>
                      <template #executionObjects="row">
                        <m-button type="link" size="small" @click="openStrategyObjects(row)">{{ tx('{count} 个对象', { count: row.objectCount }) }}</m-button>
                      </template>
                    </m-table>
                  </div>
                </section>
                <section class="inspection-subsection">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx(planRequirementTitle) }}</strong>
                    <span>{{ tx(planRequirementHint) }}</span>
                  </div>
                  <ul v-if="recordDetail.sourcePlan.checkInRequirements.length" class="check-rule-list">
                    <li v-for="rule in recordDetail.sourcePlan.checkInRequirements" :key="rule.id">
                      <div>
                        <strong>{{ rule.checkInType }}</strong>
                        <span>{{ rule.objectScope }}</span>
                      </div>
                      <m-tag type="processing">{{ tx(rule.method) }}</m-tag>
                    </li>
                  </ul>
                  <div v-else class="state-inline">{{ tx('本单无强制打卡要求') }}</div>
                </section>
                <section class="inspection-subsection">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx('成本计划') }}</strong>
                    <span>{{ tx('按人力、物资和其他费用三类查看计划成本。') }}</span>
                  </div>
                  <div class="plan-cost-panel">
                    <m-tabs v-model="planCostTab" :data="localizeOptions(planCostTabs)" />
                    <div class="plan-cost-body">
                      <div v-if="activePlanCostTab === 'labor'" class="plan-cost-pane">
                        <div class="plan-cost-pane-head">
                          <strong>{{ tx('计划人力成本') }}</strong>
                          <span>{{ tx('按实例与事项汇总后的计划人工时，不按事项展开。') }}</span>
                        </div>
                        <div class="table-wrap">
                          <m-table :columns="localizeColumns(planLaborCostColumns)" :dataSource="recordDetail.sourcePlan.costPlan.laborCosts" rowKey="id" evenColor />
                        </div>
                      </div>
                      <div v-else-if="activePlanCostTab === 'material'" class="plan-cost-pane">
                        <div class="plan-cost-pane-head">
                          <strong>{{ tx('计划物资使用') }}</strong>
                          <span>{{ tx('包含计划消耗品和工具使用情况。') }}</span>
                        </div>
                        <div class="table-wrap">
                          <m-table :columns="localizeColumns(planMaterialUsageColumns)" :dataSource="recordDetail.sourcePlan.costPlan.materialUsages" rowKey="id" evenColor>
                            <template #materialType="row">
                              <m-tag :type="row.materialType === '工具' ? 'processing' : 'completed'">{{ tx(row.materialType) }}</m-tag>
                            </template>
                          </m-table>
                        </div>
                      </div>
                      <div v-else class="plan-cost-pane">
                        <div class="plan-cost-pane-head">
                          <strong>{{ tx('计划其他费用') }}</strong>
                          <span>{{ tx('无其他费用时显示空表，有费用时按费用项列出。') }}</span>
                        </div>
                        <div v-if="recordDetail.sourcePlan.costPlan.otherFees.length" class="table-wrap">
                          <m-table :columns="localizeColumns(planOtherFeeColumns)" :dataSource="recordDetail.sourcePlan.costPlan.otherFees" rowKey="id" evenColor />
                        </div>
                        <div v-else class="plan-empty-table">
                          <div class="plan-empty-table-head">
                            <span v-for="column in planOtherFeeColumns" :key="column.dataIndex">{{ column.title }}</span>
                          </div>
                          <div class="plan-empty-box">{{ tx('暂无费用项') }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div v-else-if="activeRecordTab === 'route'" class="inspection-tab-body">
                <section class="inspection-subsection inspection-subsection--no-top">
                  <div class="inspection-subsection-head">
                    <strong>{{ tx('路线摘要') }}</strong>
                    <span>{{ tx('按规则书展示计划路线、实际路线和路线偏差说明。') }}</span>
                  </div>
                  <div class="inspection-info-grid inspection-info-grid--compact">
                    <article v-for="item in routeObjectSummaryFields" :key="item.label">
                      <span>{{ tx(item.label) }}</span>
                      <strong>{{ item.value }}</strong>
                    </article>
                  </div>
                </section>
                <div class="inspection-table-grid inspection-table-grid--route">
                  <div class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('计划路线') }}</strong>
                      <span>{{ tx('只展示空间顺序和空间所在建筑楼层。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(plannedRouteColumns)" :dataSource="recordDetail.routes.planned" rowKey="routeNo" evenColor />
                    </div>
                  </div>
                  <div class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('实际路线') }}</strong>
                      <span>{{ tx('同一空间可因不同时间录入多次出现。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(actualRouteColumns)" :dataSource="recordDetail.routes.actual" rowKey="id" evenColor />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="activeRecordTab === 'cost'" class="inspection-tab-body">
                <div class="cost-summary-grid">
                  <article v-for="item in costSummaryItems" :key="item.label" class="cost-summary-card">
                    <span>{{ tx(item.label) }}</span>
                    <strong>{{ item.value }}</strong>
                    <em>{{ tx(item.note) }}</em>
                  </article>
                </div>
                <div class="execution-section-stack">
                  <section class="inspection-subsection inspection-subsection--no-top">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('人力成本') }}</strong>
                      <span>{{ tx('按计划人工时与实际人工时对比。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(laborCostColumns)" :dataSource="recordDetail.costInfo.laborCosts" rowKey="id" evenColor />
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('物资使用') }}</strong>
                      <span>{{ tx('按计划使用量与实际消耗量对比。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(materialCostColumns)" :dataSource="recordDetail.costInfo.materialCosts" rowKey="id" evenColor>
                        <template #materialType="row">
                          <m-tag :type="row.materialType === '工具' ? 'processing' : 'completed'">{{ tx(row.materialType) }}</m-tag>
                        </template>
                      </m-table>
                    </div>
                  </section>
                  <section class="inspection-subsection">
                    <div class="inspection-subsection-head">
                      <strong>{{ tx('其他费用') }}</strong>
                      <span>{{ tx('按计划费用与实际维修金额等费用对比。') }}</span>
                    </div>
                    <div class="table-wrap">
                      <m-table :columns="localizeColumns(otherCostColumns)" :dataSource="recordDetail.costInfo.otherCosts" rowKey="id" evenColor />
                    </div>
                  </section>
                </div>
              </div>

              <div v-else class="inspection-tab-body">
                <div class="table-wrap">
                  <m-table :columns="localizeColumns(slaEvaluationColumns)" :dataSource="recordDetail.slaEvaluations" rowKey="id" evenColor>
                    <template #result="row">
                      <m-tag :type="row.result === '达标' ? 'completed' : 'processing'">{{ tx(row.result) }}</m-tag>
                    </template>
                  </m-table>
                </div>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <m-tabs v-model="activeTab" :data="localizeOptions(tabs)" size="large" />

          <div class="detail-tab-body" v-if="activeTab === 'common'">
            <SectionTitle :title="tx('公共信息')" />
            <div class="info-grid">
              <article v-for="item in commonInfo" :key="item.label">
                <span>{{ tx(item.label) }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>
            <SectionTitle :title="tx('附件证据')" />
            <div class="attachment-list">
              <div v-for="item in order.attachments" :key="item.name" class="attachment-card">
                <strong>{{ item.name }}</strong>
                <span>{{ item.type }} · {{ item.size }}</span>
              </div>
            </div>
          </div>

          <div class="detail-tab-body" v-else-if="activeTab === 'typeInfo'">
            <SectionTitle :title="typedDetail.title" />
            <p class="type-page-hint">{{ typedDetail.hint }}</p>
            <div class="type-section-list">
              <article v-for="section in typedDetail.sections" :key="section.title" class="type-section">
                <div class="block-header">
                  <strong>{{ tx(section.title) }}</strong>
                  <m-tag :type="section.tagType">{{ tx(section.tag) }}</m-tag>
                </div>
                <div class="type-field-grid">
                  <article v-for="field in section.fields" :key="field.label">
                    <span>{{ tx(field.label) }}</span>
                    <strong>{{ field.value }}</strong>
                  </article>
                </div>
              </article>
            </div>
          </div>

          <div class="detail-tab-body" v-else-if="activeTab === 'flow'">
            <SectionTitle :title="tx('流程轨迹')" />
            <div class="timeline">
              <article v-for="item in order.timeline" :key="item.node" class="timeline-item" :class="{ 'timeline-item--active': item.active }">
                <span>{{ item.time }}</span>
                <strong>{{ item.node }}</strong>
                <p>{{ item.desc }}</p>
              </article>
            </div>
          </div>

          <div class="detail-tab-body" v-else-if="activeTab === 'relations'">
            <SectionTitle :title="tx('关联单据')" />
            <div class="relation-list">
              <article v-for="item in order.relations" :key="item.code" class="relation-card">
                <m-tag type="processing">{{ tx(item.type) }}</m-tag>
                <strong>{{ item.code }}</strong>
                <span>{{ item.desc }}</span>
              </article>
            </div>
          </div>

          <div class="detail-tab-body" v-else>
            <SectionTitle :title="tx('操作记录')" />
            <div class="log-list">
              <article v-for="item in order.logs" :key="`${item.time}-${item.action}`">
                <strong>{{ item.action }}</strong>
                <span>{{ item.operator }} · {{ item.time }}</span>
                <p>{{ item.desc }}</p>
              </article>
            </div>
          </div>
        </template>
      </div>

      <aside v-if="!isWorkRecordDetail" class="detail-side-panel">
        <SectionTitle :title="tx('当前责任')" />
        <div class="side-card">
          <span>{{ tx('当前节点') }}</span>
          <strong>{{ order.currentNode }}</strong>
          <span>{{ tx('责任对象') }}</span>
          <strong>{{ order.owner }}</strong>
        </div>
        <SectionTitle :title="tx('SLA 投影')" />
        <div class="side-card">
          <span>{{ tx('目标完成') }}</span>
          <strong>{{ order.targetFinishAt }}</strong>
          <span>{{ tx('命中规则') }}</span>
          <strong>{{ order.slaPolicy }}</strong>
        </div>
        <SectionTitle :title="tx('派生关系')" />
        <div class="side-card">
          <span>{{ tx('来源') }}</span>
          <strong>{{ order.source }}</strong>
          <span>{{ tx('派生') }}</span>
          <strong>{{ tx('{count} 条关联', { count: order.relations.length }) }}</strong>
        </div>
      </aside>
    </section>

    <m-modal v-model:visible="strategyObjectModalVisible" :title="strategyObjectModalTitle" :width="840" :max-width="840">
      <template #content>
        <div class="table-wrap">
          <m-table :columns="localizeColumns(strategyObjectColumns)" :dataSource="selectedStrategyObjects" rowKey="id" evenColor />
        </div>
      </template>
      <template #footer>
        <m-button type="primary" @click="strategyObjectModalVisible = false">{{ tx('关闭') }}</m-button>
      </template>
    </m-modal>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionTitle from '@/components/SectionTitle.vue'
import { useLocale } from '../i18n'

const router = useRouter()
const route = useRoute()
const { tx, localizeColumns, localizeOptions } = useLocale()
const activeTab = ref('typeInfo')
const recordTab = ref('checkIn')
const planCostTab = ref('labor')
const strategyObjectModalVisible = ref(false)
const selectedStrategyItem = ref(null)
const workRecordTypes = ['inspection', 'maintenance', 'repair', 'engineeringChange']

const emptyRecordDetail = {
  sourcePlan: {
    planName: '-',
    planBatch: '-',
    requiredStartAt: '-',
    requiredEndAt: '-',
    strategyItems: [],
    checkInRequirements: [],
    costPlan: {
      laborCosts: [],
      materialUsages: [],
      otherFees: []
    },
    maintenanceLevel: '-',
    outageWindow: '-',
    safetyRequirement: '-',
    reportRequirement: '-'
  },
  fault: {
    relatedOrders: [],
    photos: []
  },
  diagnosis: {
    affectedSystems: [],
    attachments: []
  },
  repairPlan: {
    enabled: false,
    laborPlan: [],
    materialPlan: [],
    attachments: []
  },
  repairExecution: {
    records: [],
    actualLabor: [],
    actualMaterial: [],
    actualTools: [],
    outsourcingRecords: [],
    recoveryVerification: {}
  },
  acceptance: {
    enabled: false,
    criteria: [],
    rectificationRequirements: [],
    reworkRequirements: [],
    recheckRecords: [],
    serviceReports: [],
    signatureRecords: []
  },
  routes: {
    planned: [],
    actual: []
  },
  workflowRecords: [],
  checkInRecords: [],
  executionRecords: {
    inspections: [],
    repairs: [],
    meterReadings: []
  },
  problemAndRepairRecords: [],
  unableRecords: [],
  costInfo: {
    summary: {},
    laborCosts: [],
    materialCosts: [],
    otherCosts: []
  },
  slaEvaluations: []
}

const workTypeOptions = [
  { value: 'inspection', label: '巡检' },
  { value: 'maintenance', label: '维保' },
  { value: 'repair', label: '维修' },
  { value: 'serviceRequest', label: '报事服务' },
  { value: 'engineeringChange', label: '工程改造' },
  { value: 'assetManagement', label: '资产管理' }
]

const statusOptions = [
  { value: 'processing', label: '处理中' },
  { value: 'pendingReview', label: '待验收' },
  { value: 'pendingConfirm', label: '待确认' },
  { value: 'closed', label: '已关闭' },
  { value: 'exception', label: '异常' },
  { value: 'CRTE', label: '创建' },
  { value: 'SBMT', label: '已提交' },
  { value: 'SORJ', label: 'SO（支持审批人）驳回' },
  { value: 'SOSP', label: 'SO（支持审批人）支持通过' },
  { value: 'AORJ', label: 'AO（授权审批人）驳回' },
  { value: 'AOAP', label: 'AO（授权审批人）批准' },
  { value: 'SAPRJ', label: 'SAP（预算校验）驳回' },
  { value: 'ISSD', label: '工单已签发' },
  { value: 'ACK', label: '承包商已确认' },
  { value: 'INPR', label: '承包商执行中' },
  { value: 'RTCP', label: '承包商完工上报' },
  { value: 'RJCP', label: '完工上报驳回' },
  { value: 'PLAN', label: '方案制定中' },
  { value: 'TAPR', label: '技术审批中' },
  { value: 'TERJ', label: '技术审批驳回' },
  { value: 'PCAP', label: '进度/成本审批中' },
  { value: 'PCRJ', label: '进度/成本审批驳回' },
  { value: 'FIAP', label: '财务审批中' },
  { value: 'FIRJ', label: '财务审批驳回' },
  { value: 'PRCR', label: '采购PR已创建' },
  { value: 'POGR', label: '采购PO入库完成' },
  { value: 'STOC', label: '库存已占用' },
  { value: 'DISP', label: '已排程派工' },
  { value: 'EXE', label: '改造执行中' },
  { value: 'ACPT', label: '待改造验收' },
  { value: 'ACRJ', label: '改造验收驳回' },
  { value: 'CERT', label: '完工认证' },
  { value: 'PMCR', label: 'SAP（付款申请）已创建' },
  { value: 'BHRV', label: 'SAP（批量复核）待复核' },
  { value: 'FPCP', label: 'SAP（最终付款）已完成' }
]

const slaOptions = [
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '即将超时' },
  { value: 'overdue', label: '已超时' },
  { value: 'paused', label: '暂停' }
]

const orders = [
  {
    orderNo: 'WO-INS-20260616-001',
    title: 'B1 消防泵房日常巡检',
    workType: 'inspection',
    classification: '日常巡检',
    status: 'processing',
    currentNode: '巡检执行',
    owner: '张明',
    objectLocation: 'B1 消防泵房',
    inspectionScope: 'A座-B1-消防泵房',
    createdAt: '2026-06-16 09:00:00',
    targetFinishAt: '2026-06-16 18:00:00',
    slaStatus: 'normal',
    slaPolicy: '日常巡检班次 SLA',
    source: '巡检计划',
    detailTitle: '巡检单据详情',
    detailHint: '巡检详情强调计划来源、巡检对象、检查项完成情况、打卡和异常闭环。',
    progress: {
      statusText: '处理中',
      taskTotal: 10,
      finishedCount: 7,
      unfinishedCount: 3,
      abnormalCount: 1,
      overSymptomCount: 1,
      unexecutableCount: 1
    },
    inspectionDetail: {
      sourcePlan: {
        planName: '消防泵房日常巡检计划',
        planBatch: '20260616-白班',
        requiredStartAt: '2026-06-16 09:00:00',
        requiredEndAt: '2026-06-16 18:00:00',
        standardLaborHours: '2.80 人工时',
        standardLaborFormula: '7 个实例事项汇总',
        strategyItems: [
          {
            id: 'SI-001',
            name: '消防泵控制柜运行状态检查',
            type: '观测',
            objectCount: 2,
            executionObjects: [
              { id: 'OBJ-001', name: '消防泵控制柜 1 号', objectType: '消防泵控制柜', location: 'A 座-B1-消防泵房' },
              { id: 'OBJ-002', name: '消防泵控制柜 2 号', objectType: '消防泵控制柜', location: 'A 座-B1-消防泵房' }
            ]
          },
          {
            id: 'SI-002',
            name: '消防泵出水压力抄录',
            type: '观测',
            objectCount: 2,
            executionObjects: [
              { id: 'OBJ-003', name: '喷淋泵出口压力表', objectType: '压力表', location: 'A 座-B1-消防泵房' },
              { id: 'OBJ-004', name: '消火栓泵出口压力表', objectType: '压力表', location: 'A 座-B1-消防泵房' }
            ]
          },
          {
            id: 'SI-003',
            name: '泵房环境与通道检查',
            type: '观测',
            objectCount: 2,
            executionObjects: [
              { id: 'OBJ-005', name: 'B1 消防泵房', objectType: '空间', location: 'A 座-B1-消防泵房' },
              { id: 'OBJ-006', name: '消防通道', objectType: '空间', location: 'A 座-B1-消防泵房' }
            ]
          },
          {
            id: 'SI-004',
            name: '排水沟杂物清理',
            type: '维修',
            objectCount: 1,
            executionObjects: [
              { id: 'OBJ-007', name: 'B1 消防泵房排水沟', objectType: '空间', location: 'A 座-B1-消防泵房' }
            ]
          }
        ],
        checkInRequirements: [
          { id: 'CHECK-RULE-001', checkInType: '空间打卡', objectScope: '空间对象范围：消防泵房、空调机房、配电房', method: '拍照' },
          { id: 'CHECK-RULE-002', checkInType: '设备打卡', objectScope: '设备对象范围：消防泵控制柜、压力表、变压器', method: '扫码' }
        ],
        costPlan: {
          laborCosts: [
            { id: 'PL-001', costItem: '计划人力成本', plannedLaborHour: '2.80 人工时', plannedAmount: '224.00 元', basis: '7 个实例事项汇总，按 80.00 元/人工时估算' }
          ],
          materialUsages: [
            { id: 'PM-001', skuName: '警示贴', materialType: '耗材', plannedQuantity: '2 张', materialSituation: '通道临时提示耗材' },
            { id: 'PM-002', skuName: '手持测温仪', materialType: '工具', plannedQuantity: '1 台', materialSituation: '巡检测温工具，需归还' }
          ],
          otherFees: []
        }
      },
      routes: {
        routeDeviationNote: '实际路线因控制柜复查多一次进入控制柜区域，巡检关闭不受后续维修单处理进度影响。',
        planned: [
          { routeNo: 1, spaceName: 'B1 消防泵房', building: 'A 座', floor: 'B1' },
          { routeNo: 2, spaceName: '控制柜区域', building: 'A 座', floor: 'B1' },
          { routeNo: 3, spaceName: '泵组与压力表区域', building: 'A 座', floor: 'B1' }
        ],
        actual: [
          { id: 'AR-001', routeNo: 1, spaceName: 'B1 消防泵房', location: 'A 座-B1', executedAt: '2026-06-16 09:18:12' },
          { id: 'AR-002', routeNo: 2, spaceName: '控制柜区域', location: 'A 座-B1', executedAt: '2026-06-16 09:24:05' },
          { id: 'AR-003', routeNo: 3, spaceName: '泵组与压力表区域', location: 'A 座-B1', executedAt: '2026-06-16 09:42:31' },
          { id: 'AR-004', routeNo: 4, spaceName: '控制柜区域', location: 'A 座-B1', executedAt: '2026-06-16 10:08:46' }
        ]
      },
      workflowRecords: [
        { id: 'WF-001', nodeName: '开始', nodeType: '开始', handler: '系统', handlerDept: '-', receiveTime: '2026-06-16 09:00:00', handleTime: '2026-06-16 09:00:00', duration: '-', nodeStatus: '已完成', handleOpinion: '计划批次生成巡检工单，启动“楼层公共区日常巡检流程”。', nextNode: '巡检执行' },
        { id: 'WF-002', nodeName: '巡检执行', nodeType: '执行', handler: '张明', handlerDept: '工程部-消防专业班组', receiveTime: '2026-06-16 09:10:00', handleTime: '进行中', duration: '进行中', nodeStatus: '进行中', handleOpinion: '当前已完成7/10个作业项，已产生打卡、检查、抄录、问题和无法执行记录。', nextNode: '巡检审批', active: true },
        { id: 'WF-003', nodeName: '巡检异常派生工单', nodeType: '系统', handler: '系统', handlerDept: '系统节点', receiveTime: '巡检执行提交后触发', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '若异常需维修或整改，仅要求完成派生动作，不等待派生单据关闭。', nextNode: '巡检审批' },
        { id: 'WF-004', nodeName: '巡检审批', nodeType: '审批', handler: '工程主管', handlerDept: '工程部', receiveTime: '待提交巡检结果后进入', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '巡检执行提交后关联审批单 AP-INS-20260616-001，审批单状态待发起。', nextNode: '结束' },
        { id: 'WF-005', nodeName: '结束', nodeType: '结束', handler: '系统', handlerDept: '-', receiveTime: '待审批通过后进入', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '巡检审批通过后结束流程，单据关闭归档。', nextNode: '-' }
      ],
      checkInRecords: [
        { id: 'CI-001', checkInUser: '张明', checkInAt: '2026-06-16 09:18:12', method: '拍照', objectName: 'B1 消防泵房', attachments: ['入口照片'] },
        { id: 'CI-002', checkInUser: '张明', checkInAt: '2026-06-16 09:24:05', method: '扫码', objectName: '消防泵控制柜 1 号', attachments: ['扫码照片'] },
        { id: 'CI-003', checkInUser: '张明', checkInAt: '2026-06-16 09:42:31', method: '扫码', objectName: '喷淋泵出口压力表', attachments: ['表计照片'] }
      ],
      executionRecords: {
        inspections: [
          { id: 'IR-001', objectName: '消防泵控制柜 1 号', strategyItem: '消防泵控制柜运行状态检查', resultCategory: '正常', selectedOption: '运行正常', remark: '-', photos: [] },
          { id: 'IR-002', objectName: 'B1 消防泵房通道', strategyItem: '泵房环境与通道检查', resultCategory: '异常', selectedOption: '通道占用', remark: '已现场清理一部分，剩余需保洁协同', photos: ['异常照片1', '异常照片2'] }
        ],
        meterReadings: [
          { id: 'MR-001', objectName: '喷淋泵出口压力表', objectType: '压力表', meterPoint: '出口压力', value: '0.72', unit: 'MPa', recordedAt: '2026-06-16 09:45:10' },
          { id: 'MR-002', objectName: '消火栓泵出口压力表', objectType: '压力表', meterPoint: '出口压力', value: '0.80', unit: 'MPa', recordedAt: '2026-06-16 09:48:22' }
        ]
      },
      problemAndRepairRecords: [
        { id: 'PR-001', objectName: 'B1 消防泵房通道', objectType: '空间', problemDescription: '通道堆放杂物，影响消防通行', problemStatus: '已自修', repairMode: '自修', repairUser: '张明', repairTime: '2026-06-16 10:02:00', repairMeasure: '移除轻质杂物并设置提示牌', beforePhotos: ['维修前'], afterPhotos: ['维修后'] },
        { id: 'PR-002', objectName: '喷淋泵出口压力表', objectType: '压力表', problemDescription: '压力波动达到超征兆阈值', problemStatus: '已转维修', repairMode: '转维修', repairOrderNo: 'WO-REP-20260616-021' }
      ],
      unableRecords: [
        { id: 'UR-001', instanceName: '消防泵控制柜 2 号', objectType: '消防泵控制柜', strategyItem: '消防泵控制柜运行状态检查', reasonCategory: '封存中', reasonDesc: '设备处于封存状态，主管要求不打开柜门', feedback: '张明 / 2026-06-16 09:33:12' }
      ],
      costInfo: {
        summary: {
          plannedTotalCost: '231.00 元',
          actualTotalCost: '669.00 元',
          costVariance: '+438.00 元',
          varianceReason: '实际产生转维修和自修费用'
        },
        laborCosts: [
          { id: 'LC-001', costItem: '巡检执行人力', plannedUsage: '2.80 人工时', plannedAmount: '224.00 元', actualUsage: '2.40 人工时', actualAmount: '192.00 元', variance: '-32.00 元', sourceRecord: 'APP 执行记录 / 09:18-10:42' }
        ],
        materialCosts: [
          { id: 'MC-001', skuName: '警示贴', materialType: '耗材', plannedQuantity: '2 张', actualQuantity: '2 张', plannedAmount: '7.00 元', actualAmount: '7.00 元', variance: '0.00 元', result: '按计划消耗' },
          { id: 'MC-002', skuName: '手持测温仪', materialType: '工具', plannedQuantity: '1 台', actualQuantity: '1 台', plannedAmount: '0.00 元', actualAmount: '0.00 元', variance: '0.00 元', result: '已归还，不计消耗成本' }
        ],
        otherCosts: [
          { id: 'OC-001', feeName: '巡检其他费用', plannedContent: '无计划费用', plannedAmount: '0.00 元', actualContent: '自修与转维修费用', actualAmount: '470.00 元', variance: '+470.00 元', sourceRecord: 'PR-001 + WO-REP-20260616-021' }
        ]
      },
      slaEvaluations: [
        { id: 'SLA-001', ruleName: '首次到场响应', ruleContent: '分配后 30 分钟内完成首次打卡', actualSituation: '09:10 分配，09:18 首次打卡', result: '达标' },
        { id: 'SLA-002', ruleName: '巡检执行完成', ruleContent: '当班 18:00 前提交巡检执行', actualSituation: '当前 7/10 已完成，尚未提交', result: '进行中' },
        { id: 'SLA-003', ruleName: '消防异常升级', ruleContent: '发现消防异常后 15 分钟内通知主管', actualSituation: '09:50 发现，09:56 通知主管', result: '达标' }
      ]
    },
    detailSections: [
      section('巡检来源', '计划生成', 'processing', [
        field('计划名称', '消防系统日常巡检计划'),
        field('班次', '白班'),
        field('巡检频次', '每日一次')
      ]),
      section('巡检执行', '执行中', 'processing', [
        field('巡检路线', 'B1 消防泵房路线'),
        field('检查项', '7/10 已完成'),
        field('打卡状态', '入口已打卡，出口待打卡')
      ]),
      section('异常闭环', '可派生', 'completed', [
        field('异常数量', '0'),
        field('现场自修', '允许'),
        field('转单条件', '发现缺陷或无法现场闭环')
      ])
    ]
  },
  {
    orderNo: 'WO-MAIN-20260616-003',
    title: '冷冻泵季度外委维保',
    workType: 'maintenance',
    classification: '外委维保',
    status: 'pendingReview',
    currentNode: '维保验收',
    owner: '工程主管',
    objectLocation: '制冷机房 冷冻泵 2 号',
    supplier: '华东机电服务',
    contractNo: 'HT-MAIN-2026-042',
    createdAt: '2026-06-16 08:30:00',
    targetFinishAt: '2026-06-17 12:00:00',
    slaStatus: 'warning',
    slaPolicy: '合同周期 SLA',
    source: '维保计划',
    progress: {
      statusText: '待验收',
      taskTotal: 8,
      finishedCount: 8,
      unfinishedCount: 0,
      abnormalCount: 1,
      overSymptomCount: 0,
      unexecutableCount: 0
    },
    recordDetail: {
      sourcePlan: {
        planName: '冷冻泵季度维保计划',
        planBatch: '20260616-季度',
        maintenanceLevel: '季度',
        requiredStartAt: '2026-06-16 09:00:00',
        requiredEndAt: '2026-06-17 12:00:00',
        outageWindow: '6月16日 09:00-10:00，冷冻泵单机切换停机',
        safetyRequirement: '进入制冷机房需挂牌上锁，作业前确认旁路泵运行稳定',
        reportRequirement: '供应商需上传维保服务报告、耗材更换照片和试运行记录',
        strategyItems: [
          {
            id: 'MAIN-SI-001',
            name: '冷冻泵运行状态检查',
            type: '检查',
            objectCount: 1,
            executionObjects: [
              { id: 'MAIN-OBJ-001', name: '冷冻泵 2 号', objectType: '冷冻泵', location: 'A 座-B2-制冷机房' }
            ]
          },
          {
            id: 'MAIN-SI-002',
            name: '冷冻泵轴承润滑',
            type: '润滑',
            objectCount: 1,
            executionObjects: [
              { id: 'MAIN-OBJ-002', name: '冷冻泵 2 号轴承组', objectType: '轴承组', location: 'A 座-B2-制冷机房' }
            ]
          },
          {
            id: 'MAIN-SI-003',
            name: '运行参数抄录',
            type: '抄录',
            objectCount: 2,
            executionObjects: [
              { id: 'MAIN-OBJ-003', name: '冷冻水进水压力表', objectType: '压力表', location: 'A 座-B2-制冷机房' },
              { id: 'MAIN-OBJ-004', name: '冷冻水出水压力表', objectType: '压力表', location: 'A 座-B2-制冷机房' }
            ]
          }
        ],
        checkInRequirements: [
          { id: 'MAIN-CHECK-001', checkInType: '空间打卡', objectScope: '空间对象范围：制冷机房', method: '拍照' },
          { id: 'MAIN-CHECK-002', checkInType: '设备打卡', objectScope: '设备对象范围：冷冻泵、压力表', method: '扫码' }
        ],
        costPlan: {
          laborCosts: [
            { id: 'MAIN-PL-001', costItem: '计划人力成本', plannedLaborHour: '4.00 人工时', plannedAmount: '320.00 元', basis: '维保事项汇总，按 80.00 元/人工时估算' }
          ],
          materialUsages: [
            { id: 'MAIN-PM-001', skuName: '润滑脂', materialType: '耗材', plannedQuantity: '1 支', materialSituation: '轴承润滑耗材' },
            { id: 'MAIN-PM-002', skuName: '滤网', materialType: '耗材', plannedQuantity: '1 套', materialSituation: '维保更换耗材' }
          ],
          otherFees: [
            { id: 'MAIN-PO-001', feeName: '外委服务费', plannedAmount: '900.00 元', remark: '季度外委维保服务' }
          ]
        }
      },
      routes: {
        planned: [],
        actual: []
      },
      workflowRecords: [
        { id: 'MAIN-WF-001', nodeName: '开始', nodeType: '开始', handler: '系统', handlerDept: '-', receiveTime: '2026-06-16 08:30:00', handleTime: '2026-06-16 08:30:00', duration: '-', nodeStatus: '已完成', handleOpinion: '维保计划批次生成维保工单。', nextNode: '维保执行' },
        { id: 'MAIN-WF-002', nodeName: '维保执行', nodeType: '执行', handler: '华东机电服务', handlerDept: '供应商', receiveTime: '2026-06-16 09:00:00', handleTime: '2026-06-16 10:40:00', duration: '1小时40分钟', nodeStatus: '已完成', handleOpinion: '已完成打卡、检查、维保作业、抄录和问题记录。', nextNode: '维保验收' },
        { id: 'MAIN-WF-003', nodeName: '维保验收', nodeType: '执行', handler: '工程主管', handlerDept: '工程部', receiveTime: '2026-06-16 11:20:00', handleTime: '进行中', duration: '进行中', nodeStatus: '进行中', handleOpinion: '等待主管验收维保结果和服务报告。', nextNode: '结束', active: true },
        { id: 'MAIN-WF-004', nodeName: '结束', nodeType: '结束', handler: '系统', handlerDept: '-', receiveTime: '待验收通过后进入', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '验收通过后结束流程，单据关闭归档。', nextNode: '-' }
      ],
      checkInRecords: [
        { id: 'MAIN-CI-001', checkInUser: '供应商工程师', checkInAt: '2026-06-16 09:02:18', method: '拍照', objectName: '制冷机房', attachments: ['到场照片'] },
        { id: 'MAIN-CI-002', checkInUser: '供应商工程师', checkInAt: '2026-06-16 09:06:44', method: '扫码', objectName: '冷冻泵 2 号', attachments: ['设备扫码照片'] }
      ],
      executionRecords: {
        inspections: [
          { id: 'MAIN-IR-001', objectName: '冷冻泵 2 号', strategyItem: '冷冻泵运行状态检查', resultCategory: '正常', selectedOption: '运行稳定', remark: '无异常振动', photos: ['运行照片'] }
        ],
        repairs: [
          { id: 'MAIN-RR-001', objectName: '冷冻泵 2 号轴承组', strategyItem: '冷冻泵轴承润滑', resultCategory: '正常', selectedOption: '已完成润滑', remark: '按标准补充润滑脂', photos: ['润滑前', '润滑后'] }
        ],
        meterReadings: [
          { id: 'MAIN-MR-001', objectName: '冷冻水进水压力表', objectType: '压力表', meterPoint: '进水压力', value: '0.58', unit: 'MPa', recordedAt: '2026-06-16 09:48:12' },
          { id: 'MAIN-MR-002', objectName: '冷冻水出水压力表', objectType: '压力表', meterPoint: '出水压力', value: '0.42', unit: 'MPa', recordedAt: '2026-06-16 09:51:36' }
        ]
      },
      problemAndRepairRecords: [
        { id: 'MAIN-PR-001', objectName: '冷冻泵 2 号滤网', objectType: '滤网', problemDescription: '滤网积尘影响通风', problemStatus: '已自修', repairMode: '自修', repairUser: '供应商工程师', repairTime: '2026-06-16 10:08:00', repairMeasure: '更换滤网并清理安装位', beforePhotos: ['更换前'], afterPhotos: ['更换后'] }
      ],
      unableRecords: [],
      acceptance: {
        enabled: true,
        acceptor: '工程主管',
        acceptTime: '待验收',
        acceptMethod: '现场验收',
        acceptanceResult: '待验收',
        resultNote: '等待主管复核冷冻泵维保结果、耗材更换和服务报告。',
        criteria: [
          { id: 'MAIN-AC-001', standardItem: '运行状态', requirement: '冷冻泵试运行30分钟无异常振动和异响', result: '待验收', resultNote: '供应商已提交试运行记录' },
          { id: 'MAIN-AC-002', standardItem: '维保项目', requirement: '检查、润滑、滤网更换和参数抄录均完成', result: '待验收', resultNote: '待主管现场确认' }
        ],
        rectificationRequirements: [],
        serviceReports: [
          { id: 'MAIN-SR-001', fileName: '冷冻泵季度维保服务报告.pdf', fileType: 'PDF', uploadTime: '2026-06-16 10:45:00', uploader: '华东机电服务' }
        ],
        signatureRecords: [
          { id: 'MAIN-SIG-001', signer: '工程主管', role: '验收人', signTime: '待验收通过后签字', opinion: '待填写' }
        ]
      },
      costInfo: {
        summary: {
          plannedTotalCost: '1,220.00 元',
          actualTotalCost: '1,236.00 元',
          costVariance: '+16.00 元',
          varianceReason: '实际耗材金额略高于计划'
        },
        laborCosts: [
          { id: 'MAIN-LC-001', costItem: '维保执行人力', plannedUsage: '4.00 人工时', plannedAmount: '320.00 元', actualUsage: '4.20 人工时', actualAmount: '336.00 元', variance: '+16.00 元', sourceRecord: 'APP 执行记录 / 09:02-10:42' }
        ],
        materialCosts: [
          { id: 'MAIN-MC-001', skuName: '润滑脂', materialType: '耗材', plannedQuantity: '1 支', actualQuantity: '1 支', plannedAmount: '42.00 元', actualAmount: '42.00 元', variance: '0.00 元', result: '按计划消耗' },
          { id: 'MAIN-MC-002', skuName: '滤网', materialType: '耗材', plannedQuantity: '1 套', actualQuantity: '1 套', plannedAmount: '80.00 元', actualAmount: '80.00 元', variance: '0.00 元', result: '按计划消耗' }
        ],
        otherCosts: [
          { id: 'MAIN-OC-001', feeName: '外委服务费', plannedContent: '季度外委维保服务', plannedAmount: '900.00 元', actualContent: '供应商现场维保', actualAmount: '900.00 元', variance: '0.00 元', sourceRecord: '服务报告' }
        ],
        erpSyncStatus: '已同步'
      },
      slaEvaluations: [
        { id: 'MAIN-SLA-001', ruleName: '到场响应', ruleContent: '计划开始后 30 分钟内完成首次打卡', actualSituation: '09:00 开始，09:02 首次打卡', result: '达标' },
        { id: 'MAIN-SLA-002', ruleName: '维保执行完成', ruleContent: '2026-06-17 12:00 前完成维保执行', actualSituation: '2026-06-16 10:40 已完成执行', result: '达标' },
        { id: 'MAIN-SLA-003', ruleName: '复核验收', ruleContent: '执行提交后 4 小时内完成验收', actualSituation: '当前等待主管验收', result: '进行中' }
      ]
    },
    detailTitle: '维保单据详情',
    detailHint: '维保详情强调维保计划、维保对象、供应商作业记录、耗材与验收结论。',
    detailSections: [
      section('维保计划', '计划性', 'processing', [
        field('计划名称', '冷冻泵季度维保计划'),
        field('维保级别', '季度保养'),
        field('合同编号', 'HT-MAIN-2026-042')
      ]),
      section('外委执行', '供应商', 'completed', [
        field('供应商', '华东机电服务'),
        field('到场人员', '2 人'),
        field('服务报告', '已上传')
      ]),
      section('复核验收', '待验收', 'rejected', [
        field('验收人', '工程主管'),
        field('试运行', '30 分钟正常'),
        field('耗材', '润滑脂 1 支，滤网 1 套')
      ])
    ]
  },
  {
    orderNo: 'WO-REP-20260616-007',
    title: 'A 座大堂空调漏水应急抢修',
    workType: 'repair',
    classification: '应急抢修',
    status: 'exception',
    currentNode: '维修执行',
    owner: '值班负责人',
    objectLocation: 'A 座 1F 大堂',
    relatedSourceOrder: 'SR-20260616-011',
    faultObject: 'A 座 1F 大堂空调出风口',
    impactScope: 'A 座 1F 大堂通行区',
    urgencyLevel: '应急',
    faultStatus: '处理中',
    recoveryStatus: '临时恢复',
    acceptanceResult: '-',
    createdAt: '2026-06-16 14:45:00',
    targetFinishAt: '2026-06-16 15:30:00',
    slaStatus: 'overdue',
    slaPolicy: '15 分钟响应',
    source: '用户报事',
    progress: {
      statusText: '异常',
      taskTotal: 4,
      finishedCount: 2,
      unfinishedCount: 2,
      abnormalCount: 1,
      overSymptomCount: 0,
      unexecutableCount: 0
    },
    recordDetail: {
      sourcePlan: {
        planName: 'A 座大堂空调漏水维修方案',
        planBatch: '20260616-应急',
        requiredStartAt: '2026-06-16 14:45:00',
        requiredEndAt: '2026-06-16 15:30:00',
        strategyItems: [
          {
            id: 'REP-SI-001',
            name: '现场问题核实',
            type: '观测',
            objectCount: 1,
            executionObjects: [
              { id: 'REP-OBJ-001', name: 'A 座 1F 大堂空调出风口', objectType: '空调末端', location: 'A 座-1F-大堂' }
            ]
          },
          {
            id: 'REP-SI-002',
            name: '冷凝水排水处理',
            type: '维修',
            objectCount: 1,
            executionObjects: [
              { id: 'REP-OBJ-002', name: '冷凝水排水管路', objectType: '排水管路', location: 'A 座-1F-大堂吊顶' }
            ]
          }
        ],
        checkInRequirements: [
          { id: 'REP-CHECK-001', checkInType: '到场打卡', objectScope: '空间对象范围：A 座 1F 大堂', method: '拍照' },
          { id: 'REP-CHECK-002', checkInType: '对象打卡', objectScope: '设备对象范围：空调末端、排水管路', method: '扫码' }
        ],
        costPlan: {
          laborCosts: [
            { id: 'REP-PL-001', costItem: '计划人力成本', plannedLaborHour: '1.50 人工时', plannedAmount: '120.00 元', basis: '应急维修方案估算，按 80.00 元/人工时估算' }
          ],
          materialUsages: [
            { id: 'REP-PM-001', skuName: '警示围挡', materialType: '工具', plannedQuantity: '1 套', materialSituation: '现场临时围挡，需归还' },
            { id: 'REP-PM-002', skuName: '吸水垫', materialType: '耗材', plannedQuantity: '4 片', materialSituation: '现场吸水耗材' }
          ],
          otherFees: []
        }
      },
      routes: {
        planned: [],
        actual: []
      },
      workflowRecords: [
        { id: 'REP-WF-001', nodeName: '开始', nodeType: '开始', handler: '系统', handlerDept: '-', receiveTime: '2026-06-16 14:45:00', handleTime: '2026-06-16 14:45:00', duration: '-', nodeStatus: '已完成', handleOpinion: '用户报事生成维修工单。', nextNode: '异常核实' },
        { id: 'REP-WF-002', nodeName: '异常核实', nodeType: '执行', handler: '值班负责人', handlerDept: '工程部-暖通班组', receiveTime: '2026-06-16 14:45:00', handleTime: '2026-06-16 15:03:00', duration: '18分钟', nodeStatus: '已完成', handleOpinion: '已完成到场打卡并确认问题属实。', nextNode: '诊断排查' },
        { id: 'REP-WF-003', nodeName: '诊断排查', nodeType: '执行', handler: '值班负责人', handlerDept: '工程部-暖通班组', receiveTime: '2026-06-16 15:03:00', handleTime: '2026-06-16 15:10:00', duration: '7分钟', nodeStatus: '已完成', handleOpinion: '初步判断为冷凝水排水不畅，现场修复路径成立。', nextNode: '维修方案' },
        { id: 'REP-WF-004', nodeName: '维修方案', nodeType: '执行', handler: '值班负责人', handlerDept: '工程部-暖通班组', receiveTime: '2026-06-16 15:10:00', handleTime: '2026-06-16 15:12:00', duration: '2分钟', nodeStatus: '已完成', handleOpinion: '采用现场修复方案，设置围挡后拆检排水管路。', nextNode: '维修执行' },
        { id: 'REP-WF-005', nodeName: '维修执行', nodeType: '执行', handler: '值班负责人', handlerDept: '工程部-暖通班组', receiveTime: '2026-06-16 15:12:00', handleTime: '进行中', duration: '进行中', nodeStatus: '进行中', handleOpinion: '正在处理故障并记录恢复情况。', nextNode: '维修验收', active: true },
        { id: 'REP-WF-006', nodeName: '维修验收', nodeType: '执行', handler: '工程主管', handlerDept: '工程部', receiveTime: '待维修完成后进入', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '维修完成后验收恢复结果、确认返工或关闭。', nextNode: '结束' },
        { id: 'REP-WF-007', nodeName: '结束', nodeType: '结束', handler: '系统', handlerDept: '-', receiveTime: '待验收通过后进入', handleTime: '未开始', duration: '-', nodeStatus: '未开始', handleOpinion: '维修验收通过后关闭归档。', nextNode: '-' }
      ],
      checkInRecords: [
        { id: 'REP-CI-001', checkInUser: '值班负责人', checkInAt: '2026-06-16 15:03:12', method: '拍照', objectName: 'A 座 1F 大堂', attachments: ['到场照片'] },
        { id: 'REP-CI-002', checkInUser: '值班负责人', checkInAt: '2026-06-16 15:06:22', method: '扫码', objectName: '空调出风口', attachments: ['对象照片'] }
      ],
      executionRecords: {
        inspections: [],
        repairs: [],
        meterReadings: []
      },
      fault: {
        sourceType: '用户报事',
        relatedOrders: ['SR-20260616-011'],
        reporter: 'L3-305 商户店长',
        contactPhone: '138****2606',
        faultObject: 'A 座 1F 大堂空调出风口',
        objectType: '空调末端',
        symptom: '空调出风口持续滴水',
        impactScope: '影响大堂通行区，存在客户滑倒风险',
        riskLevel: '高',
        discoveredAt: '2026-06-16 14:40:00',
        photos: ['漏水照片', '现场围挡照片'],
        initialAction: '设置临时围挡并通知客服引导客流'
      },
      diagnosis: {
        verifier: '值班负责人',
        arrivalAt: '2026-06-16 15:03:12',
        verifyResult: '属实',
        diagnoser: '值班负责人',
        diagnosedAt: '2026-06-16 15:10:00',
        rootCause: '冷凝水排水不畅，排水管路局部堵塞',
        faultPart: '冷凝水排水管路',
        affectedSystems: ['空调系统'],
        needOutsource: false,
        waitingMaterial: false,
        handlingPath: '现场修复',
        attachments: [
          { id: 'REP-DIA-001', fileName: '排水管路检查照片.jpg', fileType: '图片', uploadTime: '2026-06-16 15:10:00', uploader: '值班负责人' }
        ]
      },
      repairPlan: {
        enabled: true,
        planName: 'A 座大堂空调漏水维修方案',
        planSummary: '拆检冷凝水排水管路，清理堵塞点，设置临时围挡并连续观察恢复效果。',
        repairMethod: '现场修复',
        requiredStartAt: '2026-06-16 14:45:00',
        requiredEndAt: '2026-06-16 15:30:00',
        outageWindow: '不停机',
        riskMeasures: '现场设置围挡，避免客户滑倒；高处拆检需两人配合。',
        acceptanceCriteria: '连续观察30分钟无滴水，地面恢复干燥，无客户通行风险。',
        approvalStatus: '不适用',
        laborPlan: [
          { id: 'REP-LP-001', costItem: '计划人力成本', plannedLaborHour: '1.50 人工时', plannedAmount: '120.00 元', basis: '应急维修方案估算' }
        ],
        materialPlan: [
          { id: 'REP-MP-001', skuName: '警示围挡', materialType: '工具', plannedQuantity: '1 套', materialSituation: '现场临时围挡，需归还' },
          { id: 'REP-MP-002', skuName: '吸水垫', materialType: '耗材', plannedQuantity: '4 片', materialSituation: '现场吸水耗材' }
        ],
        attachments: []
      },
      repairExecution: {
        records: [
          { id: 'REP-ACT-001', executor: '值班负责人', executorTeam: '暖通班组', supplier: '-', actualStartAt: '2026-06-16 15:12:00', actualEndAt: '进行中', repairObject: '冷凝水排水管路', repairMeasure: '拆检排水管路并设置临时围挡', repairResult: '临时恢复', photos: ['维修前', '处理中'] }
        ],
        actualLabor: [
          { id: 'REP-AL-001', jobType: '暖通技工', workers: '值班负责人', actualHours: '1.20 人工时', sourceRecord: 'APP 执行记录 / 15:03-当前' }
        ],
        actualMaterial: [
          { id: 'REP-AM-001', materialName: '警示围挡', materialType: '工具', actualUsage: '1 套', purpose: '现场隔离，已归还' },
          { id: 'REP-AM-002', materialName: '吸水垫', materialType: '耗材', actualUsage: '0 片', purpose: '暂未消耗' }
        ],
        actualTools: [
          { id: 'REP-TOOL-001', materialName: '疏通器', materialType: '工具', actualUsage: '1 套', purpose: '排水管路疏通' }
        ],
        outsourcingRecords: [],
        recoveryVerification: {
          method: '现场观察',
          startAt: '2026-06-16 15:25:00',
          endAt: '进行中',
          result: '待观察',
          note: '临时恢复后持续观察是否复发。',
          reopenCondition: '仍有滴水则升级专业检修'
        }
      },
      problemAndRepairRecords: [
        { id: 'REP-PR-001', objectName: 'A 座 1F 大堂空调出风口', objectType: '空调末端', problemDescription: '空调出风口持续滴水，影响大堂通行区', problemStatus: '处理中', repairMode: '自修', repairUser: '值班负责人', repairTime: '2026-06-16 15:12:00', repairMeasure: '拆检冷凝水排水管路并设置临时围挡', beforePhotos: ['维修前'], afterPhotos: ['处理中'] }
      ],
      unableRecords: [],
      acceptance: {
        enabled: true,
        acceptor: '工程主管',
        acceptTime: '待维修完成后验收',
        acceptMethod: '现场验收',
        acceptanceResult: '待验收',
        resultNote: '待维修恢复验证完成后确认。',
        criteria: [
          { id: 'REP-AC-001', standardItem: '滴水恢复', requirement: '连续观察30分钟无滴水', result: '待验收', resultNote: '待恢复验证完成' },
          { id: 'REP-AC-002', standardItem: '现场安全', requirement: '地面恢复干燥，无客户通行风险', result: '待验收', resultNote: '待主管确认' }
        ],
        reworkRequirements: [],
        recheckRecords: [],
        signatureRecords: [
          { id: 'REP-SIG-001', signer: '工程主管', role: '验收人', signTime: '待验收通过后签字', opinion: '待填写' }
        ]
      },
      costInfo: {
        summary: {
          plannedTotalCost: '132.00 元',
          actualTotalCost: '96.00 元',
          costVariance: '-36.00 元',
          varianceReason: '部分工具归还，不计消耗成本'
        },
        laborCosts: [
          { id: 'REP-LC-001', costItem: '维修执行人力', plannedUsage: '1.50 人工时', plannedAmount: '120.00 元', actualUsage: '1.20 人工时', actualAmount: '96.00 元', variance: '-24.00 元', sourceRecord: 'APP 执行记录 / 15:03-当前' }
        ],
        materialCosts: [
          { id: 'REP-MC-001', skuName: '警示围挡', materialType: '工具', plannedQuantity: '1 套', actualQuantity: '1 套', plannedAmount: '0.00 元', actualAmount: '0.00 元', variance: '0.00 元', result: '已归还，不计消耗成本' },
          { id: 'REP-MC-002', skuName: '吸水垫', materialType: '耗材', plannedQuantity: '4 片', actualQuantity: '0 片', plannedAmount: '12.00 元', actualAmount: '0.00 元', variance: '-12.00 元', result: '暂未消耗' }
        ],
        otherCosts: []
      },
      slaEvaluations: [
        { id: 'REP-SLA-001', ruleName: '首次响应', ruleContent: '15 分钟内响应', actualSituation: '14:45 生成，15:03 到场打卡', result: '超时' },
        { id: 'REP-SLA-002', ruleName: '维修恢复', ruleContent: '45 分钟内完成恢复确认', actualSituation: '当前仍在执行处理', result: '进行中' }
      ]
    },
    detailTitle: '维修单据详情',
    detailHint: '维修详情强调故障现象、诊断结论、维修措施、物料使用和恢复验证。',
    detailSections: [
      section('故障信息', '紧急', 'error', [
        field('问题现象', '空调出风口持续滴水'),
        field('影响范围', 'A 座 1F 大堂通行区'),
        field('风险等级', '高')
      ]),
      section('诊断执行', '处理中', 'processing', [
        field('初步诊断', '冷凝水排水不畅'),
        field('维修措施', '拆检排水管路并临时围挡'),
        field('物料工具', '疏通器、吸水机、警示围挡')
      ]),
      section('恢复验证', '待验证', 'rejected', [
        field('验证方式', '连续观察 30 分钟'),
        field('复发条件', '仍有滴水则升级专业检修'),
        field('复盘要求', '超时单据需补充原因')
      ])
    ]
  },
  {
    orderNo: 'SR-20260616-011',
    title: '商户报修照明闪烁',
    workType: 'serviceRequest',
    classification: '工程报修',
    status: 'pendingConfirm',
    currentNode: '用户确认',
    owner: '客服专员',
    objectLocation: 'L3-305 商户区域',
    targetFinishAt: '2026-06-16 20:00:00',
    slaStatus: 'normal',
    slaPolicy: '客户响应 SLA',
    source: 'APP 报事',
    detailTitle: '报事服务单据详情',
    detailHint: '报事服务详情强调报事人、诉求描述、受理分类、派生处理和用户确认。',
    detailSections: [
      section('报事人信息', '用户提交', 'processing', [
        field('报事人', 'L3-305 商户店长'),
        field('联系电话', '138****2606'),
        field('提交渠道', '商户 APP')
      ]),
      section('诉求受理', '已派单', 'completed', [
        field('诉求类型', '工程报修'),
        field('问题描述', '店内照明闪烁影响营业'),
        field('派生单据', '已派生维修任务')
      ]),
      section('用户确认', '待确认', 'rejected', [
        field('回访方式', 'APP 确认 + 电话回访'),
        field('满意度', '待填写'),
        field('关闭条件', '用户确认或超时自动关闭')
      ])
    ]
  },
  {
    orderNo: 'WO-EC-20260617-001',
    title: 'A座3层会议室空调系统CAPEX改造',
    workType: 'engineeringChange',
    classification: 'CAPEX改造',
    status: 'EXE',
    currentNode: '改造执行',
    owner: '王建国',
    objectLocation: 'A座-3F-会议室空调机组（设备）',
    targetObject: 'A座-3F-会议室空调机组（设备）',
    createdAt: '2026-06-17 09:30:00',
    applicant: '李建国',
    targetFinishAt: '2026-07-10 18:00:00',
    slaStatus: 'normal',
    slaPolicy: 'CAPEX改造节点 SLA',
    source: '资本项目立项',
    progress: {
      statusText: '改造执行中'
    },
    engineeringDetail: {
      demand: {
        demandSource: '资本项目立项',
        relatedOrders: ['CAPEX-2026-HVAC-003（资本项目立项）', 'WO-RP-20260615-003（维修单）'],
        applicant: '李建国',
        applicantDept: '工程部-暖通班组',
        applyTime: '2026-06-16 14:20:00',
        targetObject: 'A座-3F-会议室空调机组',
        objectType: '设备',
        changeScope: '3层会议室区域空调风管、风机盘管、温控面板',
        currentProblem: '现有空调机组运行超过8年，会议高峰期制冷能力不足，年度维修费用持续上升，已纳入2026年CAPEX资产更新范围',
        changeTarget: '更换为变频多联机系统并更新温控面板，形成可资本化资产改造闭环，提升制冷效率并降低后续维修频率',
        expectedFinishDate: '2026-07-31',
        attachments: [
          { id: 'DA-001', fileName: '会议室空调CAPEX立项说明.pdf', fileType: 'PDF', fileSize: '2.3 MB', uploadTime: '2026-06-16 14:25:00' },
          { id: 'DA-002', fileName: '现场现状照片.zip', fileType: '图片', fileSize: '18.6 MB', uploadTime: '2026-06-16 14:28:00' }
        ]
      },
      survey: {
        enabled: true,
        surveyor: '张明',
        surveyTime: '2026-06-17 10:00:00',
        siteCondition: '空调机组位于3层吊顶内，检修口尺寸800×600mm，周边有消防喷淋和烟感设备',
        impactScope: '3层整层会议区域，面积约400平方米',
        affectedSystems: ['空调系统', '消防系统', '弱电系统'],
        affectedAreas: ['3F-会议室A', '3F-会议室B', '3F-走廊'],
        affectedTenants: ['行政部', '财务部'],
        safetyRisk: '高空作业需系安全带，动火作业需办理动火证',
        outageImpact: '需断电2小时进行新旧系统切换，建议安排在周末',
        constructionLimits: '工作日9:00-17:00禁止噪音施工，需夜间作业',
        photos: [
          { id: 'SP-001', photoName: '空调机组现状-正面', shootTime: '2026-06-17 10:15:00' },
          { id: 'SP-002', photoName: '吊顶检修口与周边管线', shootTime: '2026-06-17 10:22:00' }
        ],
        surveyConclusion: '具备施工条件',
        conclusionNote: '建议采用分区域施工方式，减少对会议区域影响'
      },
      plan: {
        planName: 'A座3层会议室空调系统CAPEX改造方案V2.0',
        planSummary: '拆除现有定频空调机组，安装变频多联机系统，保留部分可复用风管，新增温控面板并纳入资本项目资产更新范围',
        planVersion: 'V2.0',
        approvalStatus: '已通过',
        requiredStartAt: '2026-06-25 08:00:00',
        requiredEndAt: '2026-07-10 18:00:00',
        constructionWindow: '工作日夜间18:00-次日08:00，周末全天',
        items: [
          {
            id: 'EPI-001',
            itemName: '拆除旧空调机组',
            itemDesc: '拆除3层会议室区域4台定频空调室内机及相关管路',
            itemNote: '需做好防尘保护，拆除后封堵管口',
            objectCount: 4,
            executionObjects: [
              { id: 'OBJ-001', name: '会议室A空调室内机', objectType: '设备', location: 'A座-3F-会议室A' },
              { id: 'OBJ-002', name: '会议室B空调室内机', objectType: '设备', location: 'A座-3F-会议室B' }
            ]
          },
          {
            id: 'EPI-002',
            itemName: '安装新多联机室内机',
            itemDesc: '安装4台变频多联机室内机，连接冷媒管路',
            itemNote: '需吊装作业，确认吊顶承重',
            objectCount: 4,
            executionObjects: [
              { id: 'OBJ-003', name: '变频多联机室内机-会议室A', objectType: '设备', location: 'A座-3F-会议室A' },
              { id: 'OBJ-004', name: '变频多联机室内机-会议室B', objectType: '设备', location: 'A座-3F-会议室B' }
            ]
          },
          {
            id: 'EPI-003',
            itemName: '管路连接与调试',
            itemDesc: '连接冷媒管路、冷凝水管路，系统调试',
            itemNote: '需保压测试24小时',
            objectCount: 1,
            executionObjects: [
              { id: 'OBJ-005', name: 'A座3F会议区空调系统', objectType: '系统', location: 'A座-3F' }
            ]
          }
        ],
        budgetTotal: '171,900.00 元',
        budgetSummary: 'CAPEX设备采购 128,000 + 辅材 13,500 + 人工 16,400 + 外委 12,000 + 其他 2,000',
        attachments: [
          { id: 'PA-001', fileName: '空调CAPEX改造施工方案V2.0.pdf', fileType: 'PDF', fileSize: '15.6 MB', uploadTime: '2026-06-18 16:30:00', uploader: '张明' },
          { id: 'PA-002', fileName: '空调系统平面布置图.dwg', fileType: 'CAD图纸', fileSize: '3.2 MB', uploadTime: '2026-06-18 16:35:00', uploader: '张明' },
          { id: 'PA-003', fileName: '设备选型报告.docx', fileType: '文档', fileSize: '1.8 MB', uploadTime: '2026-06-18 16:40:00', uploader: '李建国' }
        ],
        safetyMeasures: '1.高空作业系安全带 2.动火作业办理动火证 3.设置安全警示区',
        outageArrangement: '6月30日22:00-次日06:00断电进行新旧系统切换',
        acceptanceCriteria: '1.制冷效果达到设计要求 2.系统运行稳定72小时 3.无漏水漏气'
      },
      execution: {
        executor: '王建国',
        executorTeam: '暖通班组',
        supplier: 'XX机电安装工程有限公司',
        actualStartAt: '2026-06-25 08:00:00',
        actualEndAt: '2026-07-05 18:00:00',
        constructionRecords: [
          { id: 'CR-001', recordDate: '2026-06-25', content: '完成旧空调机组拆除，清运垃圾2车', workers: '王建国、李工、张工', duration: '8.0 小时' },
          { id: 'CR-002', recordDate: '2026-06-30', content: '完成新多联机室内机安装和冷媒管路连接', workers: '王建国、李工、外委2人', duration: '9.5 小时' }
        ],
        progressRecords: [
          { id: 'PRG-001', recordDate: '2026-06-30', finishedItem: '拆除旧空调机组', itemProgress: '100%', overallProgress: '40%' },
          { id: 'PRG-002', recordDate: '2026-07-05', finishedItem: '管路连接与调试', itemProgress: '100%', overallProgress: '100%' }
        ],
        photos: [
          { id: 'CP-001', photoName: '旧机组拆除后现场', stage: '施工中', shootTime: '2026-06-26 17:30:00', shooter: '王建国' },
          { id: 'CP-002', photoName: '新系统安装完成', stage: '施工后', shootTime: '2026-07-05 17:45:00', shooter: '王建国' }
        ],
        problemRecords: [
          { id: 'PROB-001', problemDesc: '发现原风管老化严重，需更换', foundAt: '2026-06-27 10:00:00', foundBy: '王建国', handlingMethod: '申请变更，增加风管更换', status: '已解决' }
        ],
        changeRecords: [
          { id: 'CHG-001', changeContent: '增加风管更换，涉及3层主风管约20米', changeReason: '原风管老化严重，无法继续使用', changeTime: '2026-06-28 09:00:00', approvalNo: 'CH-EC-20260628-001', approvalStatus: '已通过' }
        ],
        safetyExecution: [
          { id: 'SAFE-001', safetyMeasure: '高空作业安全带', status: '已执行', checker: '李建国', checkTime: '2026-06-25 08:30:00' },
          { id: 'SAFE-002', safetyMeasure: '动火作业许可证', status: '不适用', checker: '李建国', checkTime: '2026-06-25 08:30:00' }
        ],
        actualLabor: [
          { id: 'AL-001', jobType: '暖通工', actualHours: '32.00 人工时', workers: '王建国、李工' },
          { id: 'AL-002', jobType: '电工', actualHours: '8.00 人工时', workers: '张工' }
        ],
        actualMaterial: [
          { id: 'AM-001', materialName: '变频多联机室内机', actualUsage: '4 台', purpose: '安装' },
          { id: 'AM-002', materialName: '冷媒管', actualUsage: '60 米', purpose: '管路连接' }
        ]
      },
      acceptance: {
        enabled: true,
        acceptor: '李建国',
        acceptTime: '2026-07-06 14:00:00',
        acceptMethod: '现场验收',
        criteria: [
          { id: 'AC-001', standardItem: '制冷效果', requirement: '室内温度达到设定温度±1℃', result: '合格', resultNote: '实测温度25.5℃，设定25℃，符合要求' },
          { id: 'AC-002', standardItem: '系统稳定性', requirement: '系统连续运行72小时无故障', result: '有条件通过', resultNote: '已运行48小时，剩余24小时继续观察' }
        ],
        acceptanceResult: '有条件通过',
        resultNote: '系统运行正常，制冷效果达标，温控面板标识需补齐后复验',
        rectificationRequirements: [
          { id: 'RR-001', rectificationItem: '温控面板标识不全', deadline: '2026-07-08', owner: '王建国', status: '已完成' }
        ],
        recheckRecords: [
          { id: 'RC-001', recheckTime: '2026-07-09 10:00:00', rechecker: '李建国', conclusion: '合格', note: '整改事项已完成，复验合格' }
        ],
        photos: [
          { id: 'AP-001', photoName: '验收现场-新空调系统', shootTime: '2026-07-06 14:30:00', shooter: '李建国' }
        ],
        signatureRecords: [
          { id: 'SIG-001', signer: '李建国', role: '工程主管', signTime: '2026-07-06 15:00:00', opinion: '同意验收', signature: '电子签名已采集' }
        ]
      },
      cost: {
        budgetTotal: '171,900.00 元',
        actualTotal: '173,500.00 元',
        varianceAmount: '+1,600.00 元',
        varianceRate: '+2.2%',
        varianceReason: '增加风管更换，材料费增加1,600元',
        categoryCosts: [
          { id: 'CC-001', category: '人力成本', budgetAmount: '6,400.00 元', actualAmount: '7,200.00 元', varianceAmount: '+800.00 元', varianceRate: '+12.5%', varianceReason: '增加风管更换，多2个人工' },
          { id: 'CC-002', category: '物料成本', budgetAmount: '151,500.00 元', actualAmount: '153,100.00 元', varianceAmount: '+1,600.00 元', varianceRate: '+1.1%', varianceReason: '增加20米风管' },
          { id: 'CC-003', category: '外委费用', budgetAmount: '12,000.00 元', actualAmount: '12,000.00 元', varianceAmount: '0.00 元', varianceRate: '0%', varianceReason: '-' },
          { id: 'CC-004', category: '其他费用', budgetAmount: '2,000.00 元', actualAmount: '1,200.00 元', varianceAmount: '-800.00 元', varianceRate: '-40%', varianceReason: '垃圾清运费用节省' }
        ],
        laborCosts: [
          { id: 'LC-EC-001', jobType: '暖通工', plannedHours: '16.00 人工时', actualHours: '18.00 人工时', hourVariance: '+2.00', unitPrice: '80.00 元/人工时', plannedAmount: '1,280.00 元', actualAmount: '1,440.00 元', amountVariance: '+160.00 元' },
          { id: 'LC-EC-002', jobType: '电工', plannedHours: '8.00 人工时', actualHours: '8.00 人工时', hourVariance: '0', unitPrice: '80.00 元/人工时', plannedAmount: '640.00 元', actualAmount: '640.00 元', amountVariance: '0' }
        ],
        materialCosts: [
          { id: 'MC-EC-001', materialName: '变频多联机室内机', spec: 'MDV-D45T2/N1-A', plannedQty: '4 台', actualQty: '4 台', qtyVariance: '0', unitPrice: '8,000.00 元', plannedAmount: '32,000.00 元', actualAmount: '32,000.00 元', amountVariance: '0' },
          { id: 'MC-EC-002', materialName: '风管', spec: '镀锌板δ0.75', plannedQty: '0 米', actualQty: '20 米', qtyVariance: '+20 米', unitPrice: '80.00 元/米', plannedAmount: '0', actualAmount: '1,600.00 元', amountVariance: '+1,600.00 元' }
        ],
        outsourcingFees: [
          { id: 'OF-001', supplier: 'XX机电安装工程有限公司', serviceContent: '吊装作业', contractAmount: '12,000.00 元', settlementAmount: '12,000.00 元', varianceAmount: '0', paymentStatus: '已付款' }
        ],
        otherFees: [
          { id: 'OFC-001', feeName: '垃圾清运费', budgetAmount: '800.00 元', actualAmount: '0', varianceAmount: '-800.00 元', note: '施工方自行处理' },
          { id: 'OFC-002', feeName: '成品保护费', budgetAmount: '400.00 元', actualAmount: '400.00 元', varianceAmount: '0', note: '地面保护材料' }
        ],
        materialRequests: [
          { id: 'MRQ-001', materialReqNo: 'MR-20260625-001', materialName: '冷媒管', reqQuantity: '70 米', usedQuantity: '60 米', returnQuantity: '10 米', reqPerson: '王建国', reqTime: '2026-06-25 08:30:00' }
        ],
        workHourRecords: [
          { id: 'WH-001', workDate: '2026-06-25', jobType: '暖通工', worker: '王建国', workHours: '8.00 小时', workContent: '拆除旧空调机组', recorder: '李建国' }
        ],
        contractNo: 'CT-2026-0618-001',
        supplier: 'XX机电安装工程有限公司',
        contractAmount: '12,000.00 元',
        changeOrderAmount: '0.00 元',
        settlementAmount: '12,000.00 元',
        paidAmount: '6,000.00 元',
        unpaidAmount: '6,000.00 元',
        invoiceStatus: '已收票',
        paymentMilestones: [
          { id: 'PMT-001', milestone: '预付款', ratio: '50%', payableAmount: '6,000.00 元', paidAmount: '6,000.00 元', payTime: '2026-06-20', status: '已付' },
          { id: 'PMT-002', milestone: '进度款', ratio: '30%', payableAmount: '3,600.00 元', paidAmount: '0', payTime: '-', status: '待付' }
        ],
        settlementStatus: '结算中',
        costCollectionStatus: '已归集',
        erpSyncStatus: '同步中'
      },
      archive: {
        ledgerEnabled: true,
        affectedObjects: [
          { id: 'AO-001', objectType: '设备', objectName: 'A座-3F-会议室空调机组', impactType: '变更' },
          { id: 'AO-002', objectType: '系统', objectName: 'A座3F会议区空调系统', impactType: '参数更新' }
        ],
        updateContents: [
          { id: 'UC-001', objectName: 'A座-3F-会议室空调机组', beforeContent: '定频空调机组，型号XXX，2018年安装', afterContent: '变频多联机，型号MDV-D45T2/N1-A，2026年安装', updateField: '设备型号、安装日期、设备参数' }
        ],
        updater: '李建国',
        updateTime: '2026-07-07 10:00:00',
        updateAttachments: [
          { id: 'UA-001', fileName: '设备台账更新记录.xlsx', fileType: 'Excel', uploadTime: '2026-07-07 10:05:00' }
        ],
        updateResult: '已完成',
        resultNote: '设备台账已更新，BA系统参数已同步',
        archiveReady: true,
        archiveDocs: [
          { id: 'AD-001', docName: '竣工图纸-空调系统平面图', docType: '竣工图纸', copyCount: '2', medium: '电子+纸质', required: '是', archiveStatus: '已归档' },
          { id: 'AD-002', docName: '变频多联机保修卡', docType: '保修卡', copyCount: '1', medium: '纸质', required: '是', archiveStatus: '待归档' },
          { id: 'AD-003', docName: '验收报告', docType: '验收报告', copyCount: '1', medium: '电子+纸质', required: '是', archiveStatus: '已归档' }
        ],
        handoverPerson: '王建国',
        handoverTime: '2026-07-08 10:00:00',
        receiver: '资料室-陈工',
        receiverDept: '工程部-资料室',
        receiveTime: '2026-07-08 11:00:00',
        handoverNote: '纸质资料2套，电子版U盘1个',
        requiredTotal: '8',
        archivedCount: '7',
        unarchivedCount: '1',
        archiveRate: '87.5%',
        missingDocs: '保修卡待厂家邮寄，预计7月15日前到',
        overallArchiveStatus: '部分归档'
      },
      workflowRecords: capexEngineeringWorkflowRecords('改造执行', 'EWF', '2026-06-17 09:30:00')
    }
  },
  {
    orderNo: 'AST-20260616-001',
    title: '资产变更单据样例',
    workType: 'assetManagement',
    classification: '资产变更',
    status: 'processing',
    currentNode: '台账复核',
    owner: '资产管理员',
    objectLocation: '资产台账',
    targetFinishAt: '2026-06-18 18:00:00',
    slaStatus: 'normal',
    slaPolicy: '资产台账处理 SLA',
    source: '人工创建',
    detailTitle: '资产管理单据详情',
    detailHint: '资产管理详情强调资产台账变更、盘点依据、变更前后内容和审批留痕。',
    detailSections: [
      section('资产变更', '台账', 'processing', [
        field('资产编号', 'AST-HVAC-00928'),
        field('变更类型', '位置变更'),
        field('变更原因', '设备迁移后同步台账')
      ]),
      section('变更前后', '差异', 'completed', [
        field('原位置', 'B2 备件库'),
        field('新位置', 'B2 冷站'),
        field('责任部门', '工程部')
      ]),
      section('审批留痕', '待审批', 'rejected', [
        field('提交人', '资产管理员'),
        field('审批人', '工程经理'),
        field('附件', '迁移照片、盘点记录')
      ])
    ]
  }
]

const engineeringBaseOrder = orders.find(item => item.orderNo === 'WO-EC-20260617-001')
orders.push(
  createEngineeringChangeSampleOrder({
    orderNo: 'WO-EC-20260618-002',
    title: 'B座2层公共走廊照明节能改造',
    classification: '小型工程',
    status: 'SBMT',
    currentNode: 'AO（授权审批人）审批',
    owner: '工程经理',
    objectLocation: 'B座-2F-公共走廊照明系统',
    targetObject: 'B座2层公共走廊照明系统（系统）',
    createdAt: '2026-06-18 09:10:00',
    applicant: '赵琳',
    targetFinishAt: '2026-06-30 18:00:00',
    slaStatus: 'normal',
    slaPolicy: '小型工程审批与执行 SLA',
    source: '运营节能专项',
    progress: {
      statusText: '已提交'
    },
    engineeringDetail: {
      demand: {
        demandSource: '运营节能专项',
        relatedOrders: ['ENERGY-20260610-002（能耗优化建议）'],
        applicant: '赵琳',
        applicantDept: '运营管理部',
        applyTime: '2026-06-18 09:10:00',
        targetObject: 'B座2层公共走廊照明系统',
        objectType: '系统',
        changeScope: 'B座2层公共走廊48盏筒灯及6个回路开关面板',
        currentProblem: '现有灯具功率偏高，部分灯具光衰明显，夜间公共区照度不均，属于可快速闭环的小型节能工程。',
        changeTarget: '替换为低功耗LED灯具，统一色温和照度，在不改变原有线路的前提下降低公共区夜间能耗。',
        expectedFinishDate: '2026-06-30',
        attachments: [
          { id: 'EC2-DA-001', fileName: 'B座2层公共区照度与能耗记录.xlsx', fileType: 'Excel', fileSize: '820 KB', uploadTime: '2026-06-18 09:18:00' }
        ]
      },
      survey: {
        enabled: true,
        surveyor: '周鹏',
        surveyTime: '2026-06-18 11:00:00',
        siteCondition: '公共走廊吊顶完整，灯具间距约2.4米，现有回路可复用。',
        impactScope: 'B座2层公共走廊与电梯厅，约260平方米',
        affectedSystems: ['照明系统', '弱电门禁系统'],
        affectedAreas: ['B座-2F-公共走廊', 'B座-2F-电梯厅'],
        affectedTenants: ['2F东侧办公区'],
        safetyRisk: '夜间登高作业需设置围挡和临时照明。',
        outageImpact: '施工期间对应回路需分段断电，每段约30分钟。',
        constructionLimits: '工作日18:30后施工，避免影响办公区通行。',
        photos: [
          { id: 'EC2-SP-001', photoName: '走廊灯具现状', shootTime: '2026-06-18 11:12:00' },
          { id: 'EC2-SP-002', photoName: '配电回路标识', shootTime: '2026-06-18 11:24:00' }
        ],
        surveyConclusion: '具备施工条件',
        conclusionNote: '可按分段替换方式施工，无需新增桥架和管线。'
      },
      plan: {
        planName: 'B座2层照明节能改造方案V1.0',
        planSummary: '保留原有线路，更换LED筒灯和开关面板，施工后复测照度。',
        planVersion: 'V1.0',
        approvalStatus: '待审批',
        requiredStartAt: '2026-06-24 18:30:00',
        requiredEndAt: '2026-06-30 18:00:00',
        constructionWindow: '工作日18:30-22:30，周末白天可施工',
        items: [
          {
            id: 'EC2-EPI-001',
            itemName: '替换LED筒灯',
            itemDesc: '拆除旧灯具并安装48盏LED筒灯。',
            itemNote: '分段断电施工，保持通道可通行。',
            objectCount: 48,
            executionObjects: [
              { id: 'EC2-OBJ-001', name: 'B座2层公共走廊灯具', objectType: '灯具', location: 'B座-2F-公共走廊' }
            ]
          },
          {
            id: 'EC2-EPI-002',
            itemName: '照度复测',
            itemDesc: '施工完成后复测走廊、转角和电梯厅照度。',
            itemNote: '形成照度复测记录作为验收附件。',
            objectCount: 6,
            executionObjects: [
              { id: 'EC2-OBJ-002', name: 'B座2层照度测点', objectType: '测点', location: 'B座-2F' }
            ]
          }
        ],
        budgetTotal: '18,600.00 元',
        budgetSummary: 'LED灯具 12,000 + 人工 4,800 + 成品保护 1,800',
        attachments: [
          { id: 'EC2-PA-001', fileName: 'B座2层照明节能改造方案V1.0.pdf', fileType: 'PDF', fileSize: '4.2 MB', uploadTime: '2026-06-18 16:20:00', uploader: '周鹏' }
        ],
        safetyMeasures: '分段断电、登高作业监护、施工围挡和临时照明。',
        outageArrangement: '按走廊东/中/西三段分段断电，每段不超过30分钟。',
        acceptanceCriteria: '灯具点亮率100%，公共走廊平均照度满足设计值，无明显眩光。'
      },
      execution: {
        executor: '待审批后派工',
        executorTeam: '工程部-强电班组',
        supplier: '自营班组',
        actualStartAt: '未开始',
        actualEndAt: '未开始',
        constructionRecords: [],
        progressRecords: [],
        photos: [],
        problemRecords: [],
        changeRecords: [],
        safetyExecution: [],
        actualLabor: [],
        actualMaterial: []
      },
      acceptance: {
        enabled: true,
        acceptor: '工程主管',
        acceptTime: '待执行完成',
        acceptMethod: '现场验收',
        criteria: [
          { id: 'EC2-AC-001', standardItem: '照度复测', requirement: '平均照度满足设计值', result: '未开始', resultNote: '-' },
          { id: 'EC2-AC-002', standardItem: '灯具运行', requirement: '连续点亮2小时无闪烁', result: '未开始', resultNote: '-' }
        ],
        acceptanceResult: '未开始',
        resultNote: '-',
        rectificationRequirements: [],
        recheckRecords: [],
        photos: [],
        signatureRecords: []
      },
      cost: {
        budgetTotal: '18,600.00 元',
        actualTotal: '0.00 元',
        varianceAmount: '-18,600.00 元',
        varianceRate: '-100%',
        varianceReason: '尚未执行，未产生成本',
        categoryCosts: [
          { id: 'EC2-CC-001', category: '人力成本', budgetAmount: '4,800.00 元', actualAmount: '0.00 元', varianceAmount: '-4,800.00 元', varianceRate: '-100%', varianceReason: '未执行' },
          { id: 'EC2-CC-002', category: '物料成本', budgetAmount: '12,000.00 元', actualAmount: '0.00 元', varianceAmount: '-12,000.00 元', varianceRate: '-100%', varianceReason: '未领料' },
          { id: 'EC2-CC-003', category: '其他费用', budgetAmount: '1,800.00 元', actualAmount: '0.00 元', varianceAmount: '-1,800.00 元', varianceRate: '-100%', varianceReason: '未发生' }
        ],
        laborCosts: [],
        materialCosts: [],
        outsourcingFees: [],
        otherFees: [],
        materialRequests: [],
        workHourRecords: [],
        contractNo: '-',
        supplier: '自营班组',
        contractAmount: '0.00 元',
        changeOrderAmount: '0.00 元',
        settlementAmount: '0.00 元',
        paidAmount: '0.00 元',
        unpaidAmount: '0.00 元',
        invoiceStatus: '不涉及',
        paymentMilestones: [],
        settlementStatus: '未开始',
        costCollectionStatus: '未开始',
        erpSyncStatus: '未同步'
      },
      archive: pendingEngineeringArchive('EC2'),
      workflowRecords: minorEngineeringWorkflowRecords('AO（授权审批人）审批', 'EC2-WF', '2026-06-18 09:10:00')
    }
  }),
  createEngineeringChangeSampleOrder({
    orderNo: 'WO-EC-20260619-003',
    title: 'C座屋面排水沟防汛整改工程',
    classification: '项目工程',
    status: 'INPR',
    currentNode: '承包商施工执行',
    owner: '安辰防水工程',
    objectLocation: 'C座-屋面-排水沟与溢流口',
    targetObject: 'C座屋面排水沟与溢流口（空间/设施）',
    createdAt: '2026-06-19 08:40:00',
    applicant: '安全品质部',
    targetFinishAt: '2026-07-05 18:00:00',
    slaStatus: 'warning',
    slaPolicy: '防汛整改专项 SLA',
    source: '防汛专项检查',
    progress: {
      statusText: '承包商执行中'
    },
    engineeringDetail: {
      demand: {
        demandSource: '防汛专项检查',
        relatedOrders: ['CHK-RAIN-20260618-006（防汛检查记录）'],
        applicant: '安全品质部',
        applicantDept: '安全品质部',
        applyTime: '2026-06-19 08:40:00',
        targetObject: 'C座屋面排水沟与溢流口',
        objectType: '空间/设施',
        changeScope: '屋面北侧排水沟约45米、4处溢流口和2处防水收口',
        currentProblem: '排水沟局部沉积淤泥，北侧溢流口高度不一致，暴雨期间存在短时积水风险，需要作为跨专业项目工程统一排期整改。',
        changeTarget: '清理排水沟、修复防水收口并调整溢流口高度，完成蓄水观察和防汛整改闭环。',
        expectedFinishDate: '2026-07-05',
        attachments: [
          { id: 'EC3-DA-001', fileName: '防汛专项检查问题照片包.zip', fileType: '图片包', fileSize: '12.4 MB', uploadTime: '2026-06-19 08:55:00' }
        ]
      },
      survey: {
        enabled: true,
        surveyor: '周鹏',
        surveyTime: '2026-06-19 10:30:00',
        siteCondition: '屋面可通行，北侧排水沟有淤泥沉积，防水层两处边角老化。',
        impactScope: 'C座屋面排水系统及顶层办公区防渗漏风险',
        affectedSystems: ['给排水系统', '屋面防水系统'],
        affectedAreas: ['C座屋面北侧', 'C座顶层办公区'],
        affectedTenants: ['C座顶层办公室'],
        safetyRisk: '屋面临边作业需设置防坠落措施，雨天禁止施工。',
        outageImpact: '不涉及停机断电，施工期间需封闭屋面通道。',
        constructionLimits: '避开降雨天气，防水修复后需保留24小时固化时间。',
        photos: [
          { id: 'EC3-SP-001', photoName: '排水沟淤泥现状', shootTime: '2026-06-19 10:42:00' },
          { id: 'EC3-SP-002', photoName: '溢流口高度差', shootTime: '2026-06-19 10:58:00' }
        ],
        surveyConclusion: '具备整改条件',
        conclusionNote: '材料和天气窗口满足后可进入施工。'
      },
      plan: {
        planName: 'C座屋面排水沟防汛整改方案V1.0',
        planSummary: '清淤、修复防水收口、调整溢流口高度并进行蓄水观察。',
        planVersion: 'V1.0',
        approvalStatus: '已通过',
        requiredStartAt: '2026-06-26 08:00:00',
        requiredEndAt: '2026-07-05 18:00:00',
        constructionWindow: '连续晴天窗口，优先安排6月26日至6月28日',
        items: [
          {
            id: 'EC3-EPI-001',
            itemName: '排水沟清淤',
            itemDesc: '清理屋面北侧排水沟淤泥并复核坡向。',
            itemNote: '清理后拍照留存。',
            objectCount: 1,
            executionObjects: [
              { id: 'EC3-OBJ-001', name: 'C座屋面北侧排水沟', objectType: '排水沟', location: 'C座-屋面' }
            ]
          },
          {
            id: 'EC3-EPI-002',
            itemName: '防水收口修复',
            itemDesc: '修复2处防水收口老化点。',
            itemNote: '施工后做蓄水观察。',
            objectCount: 2,
            executionObjects: [
              { id: 'EC3-OBJ-002', name: '屋面防水收口', objectType: '防水节点', location: 'C座-屋面北侧' }
            ]
          }
        ],
        budgetTotal: '42,300.00 元',
        budgetSummary: '防水材料 18,500 + 人工 11,200 + 外委高空防护 8,600 + 其他 4,000',
        attachments: [
          { id: 'EC3-PA-001', fileName: 'C座屋面防汛整改方案V1.0.pdf', fileType: 'PDF', fileSize: '6.8 MB', uploadTime: '2026-06-20 15:10:00', uploader: '周鹏' }
        ],
        safetyMeasures: '临边防护、雨天停工、材料防滑堆放。',
        outageArrangement: '不涉及停机断电。',
        acceptanceCriteria: '排水顺畅、防水收口无渗漏、蓄水观察无异常。'
      },
      execution: {
        executor: '安辰防水工程',
        executorTeam: '工程部-综合维修班组',
        supplier: '安辰防水工程',
        actualStartAt: '2026-06-26 08:10:00',
        actualEndAt: '未开始',
        constructionRecords: [
          { id: 'EC3-CR-001', recordDate: '2026-06-26', content: '完成屋面通道围挡、临边防护和北侧排水沟首段清淤。', workers: '安辰防水工程3人、周鹏', duration: '7.5 小时' }
        ],
        progressRecords: [
          { id: 'EC3-PRG-001', recordDate: '2026-06-26', finishedItem: '排水沟清淤首段', itemProgress: '45%', overallProgress: '30%' }
        ],
        photos: [
          { id: 'EC3-CP-001', photoName: '屋面排水沟清淤施工中', stage: '施工中', shootTime: '2026-06-26 16:10:00', shooter: '周鹏' }
        ],
        problemRecords: [],
        changeRecords: [],
        safetyExecution: [
          { id: 'EC3-SAFE-001', safetyMeasure: '屋面临边防护', status: '已执行', checker: '周鹏', checkTime: '2026-06-26 08:20:00' },
          { id: 'EC3-SAFE-002', safetyMeasure: '天气窗口确认', status: '已确认', checker: '安全品质部', checkTime: '2026-06-26 08:25:00' }
        ],
        actualLabor: [],
        actualMaterial: []
      },
      acceptance: {
        enabled: true,
        acceptor: '安全品质部',
        acceptTime: '待执行完成',
        acceptMethod: '现场验收+蓄水观察',
        criteria: [
          { id: 'EC3-AC-001', standardItem: '排水效果', requirement: '排水沟无明显积水', result: '未开始', resultNote: '-' },
          { id: 'EC3-AC-002', standardItem: '防水效果', requirement: '蓄水观察无渗漏', result: '未开始', resultNote: '-' }
        ],
        acceptanceResult: '未开始',
        resultNote: '-',
        rectificationRequirements: [],
        recheckRecords: [],
        photos: [],
        signatureRecords: []
      },
      cost: {
        budgetTotal: '42,300.00 元',
        actualTotal: '0.00 元',
        varianceAmount: '-42,300.00 元',
        varianceRate: '-100%',
        varianceReason: '承包商执行中，费用按预算暂估',
        categoryCosts: [
          { id: 'EC3-CC-001', category: '人力成本', budgetAmount: '11,200.00 元', actualAmount: '0.00 元', varianceAmount: '-11,200.00 元', varianceRate: '-100%', varianceReason: '未执行' },
          { id: 'EC3-CC-002', category: '物料成本', budgetAmount: '18,500.00 元', actualAmount: '0.00 元', varianceAmount: '-18,500.00 元', varianceRate: '-100%', varianceReason: '待领料' },
          { id: 'EC3-CC-003', category: '外委费用', budgetAmount: '8,600.00 元', actualAmount: '0.00 元', varianceAmount: '-8,600.00 元', varianceRate: '-100%', varianceReason: '待进场' },
          { id: 'EC3-CC-004', category: '其他费用', budgetAmount: '4,000.00 元', actualAmount: '0.00 元', varianceAmount: '-4,000.00 元', varianceRate: '-100%', varianceReason: '未发生' }
        ],
        laborCosts: [],
        materialCosts: [],
        outsourcingFees: [
          { id: 'EC3-OF-001', supplier: '安辰防水工程', serviceContent: '屋面防水收口修复', contractAmount: '8,600.00 元', settlementAmount: '0.00 元', varianceAmount: '-8,600.00 元', paymentStatus: '执行中' }
        ],
        otherFees: [],
        materialRequests: [
          { id: 'EC3-MRQ-001', materialReqNo: 'MR-20260621-003', materialName: '聚氨酯防水涂料', reqQuantity: '6 桶', usedQuantity: '0', returnQuantity: '0', reqPerson: '周鹏', reqTime: '2026-06-21 09:30:00' }
        ],
        workHourRecords: [],
        contractNo: 'CT-2026-0621-003',
        supplier: '安辰防水工程',
        contractAmount: '8,600.00 元',
        changeOrderAmount: '0.00 元',
        settlementAmount: '0.00 元',
        paidAmount: '0.00 元',
        unpaidAmount: '8,600.00 元',
        invoiceStatus: '未收票',
        paymentMilestones: [],
        settlementStatus: '未开始',
        costCollectionStatus: '未开始',
        erpSyncStatus: '未同步'
      },
      archive: pendingEngineeringArchive('EC3'),
      workflowRecords: projectEngineeringWorkflowRecords('承包商施工执行', 'EC3-WF', '2026-06-19 08:40:00')
    }
  }),
  createEngineeringChangeSampleOrder({
    orderNo: 'WO-EC-20260620-004',
    title: 'L3餐饮商户排油烟接驳改造',
    classification: '租户工程',
    status: 'ACK',
    currentNode: '承包商施工执行',
    owner: '租户施工方-海悦餐饮',
    objectLocation: 'L3-305 海悦餐饮排油烟系统接驳点',
    targetObject: 'L3-305 海悦餐饮排油烟系统接驳点（租户工程）',
    createdAt: '2026-06-20 13:20:00',
    applicant: '招商运营部',
    targetFinishAt: '2026-07-08 18:00:00',
    slaStatus: 'normal',
    slaPolicy: '租户工程审批与施工 SLA',
    source: '租户工程申请',
    progress: {
      statusText: '承包商已确认'
    },
    engineeringDetail: {
      demand: {
        demandSource: '租户工程申请',
        relatedOrders: ['TENANT-FITOUT-20260618-005（商户装修申请）'],
        applicant: '招商运营部',
        applicantDept: '招商运营部',
        applyTime: '2026-06-20 13:20:00',
        targetObject: 'L3-305 海悦餐饮排油烟系统接驳点',
        objectType: '租户铺位/专业系统接口',
        changeScope: 'L3-305铺位排油烟支管接驳、防火阀联动、补风口和BA监测点位接入',
        currentProblem: '餐饮租户进场装修需接入商场公共排油烟主立管，现状预留接口口径和防火阀联动点位需复核，否则无法完成装修验收。',
        changeTarget: '完成租户排油烟支管接驳、防火阀联动测试和排风量复测，满足餐饮铺位开业前工程验收要求。',
        expectedFinishDate: '2026-07-08',
        attachments: [
          { id: 'EC4-DA-001', fileName: '海悦餐饮租户工程申请表.pdf', fileType: 'PDF', fileSize: '2.1 MB', uploadTime: '2026-06-20 13:28:00' },
          { id: 'EC4-DA-002', fileName: 'L3-305装修机电图纸.zip', fileType: '图纸包', fileSize: '16.7 MB', uploadTime: '2026-06-20 13:35:00' }
        ]
      },
      survey: {
        enabled: true,
        surveyor: '陈凯',
        surveyTime: '2026-06-21 09:00:00',
        siteCondition: 'L3-305铺位吊顶已拆开，排油烟主立管预留接口完好，防火阀控制线需新增至BA箱。',
        impactScope: 'L3餐饮区排油烟支管、消防联动和商户装修验收。',
        affectedSystems: ['排油烟系统', '消防联动系统', '强电系统', 'BA监测系统'],
        affectedAreas: ['L3-305铺位', 'L3餐饮后勤通道', 'L3排油烟管井'],
        affectedTenants: ['海悦餐饮', 'L3-303咖啡商户', 'L3-306轻食商户'],
        safetyRisk: '吊顶内作业、动火开孔和消防联动测试需专项许可。',
        outageImpact: '联动测试期间L3餐饮区排油烟风机需短暂停机约20分钟。',
        constructionLimits: '商场营业时间禁止动火和噪音施工，需在22:00后进行接驳和联动测试。',
        photos: [
          { id: 'EC4-SP-001', photoName: 'L3-305排油烟预留接口', shootTime: '2026-06-21 09:18:00' },
          { id: 'EC4-SP-002', photoName: 'BA箱与防火阀控制点位', shootTime: '2026-06-21 09:30:00' }
        ],
        surveyConclusion: '具备租户工程施工条件',
        conclusionNote: '需租户施工方按商场机电标准施工，物业工程部负责节点复核和联动测试见证。'
      },
      plan: {
        planName: 'L3-305海悦餐饮排油烟接驳工程方案V1.0',
        planSummary: '租户施工方完成支管接驳、防火阀安装和BA点位接入，物业工程部复核接口、防火封堵和排风量。',
        planVersion: 'V1.0',
        approvalStatus: '已通过',
        requiredStartAt: '2026-06-24 22:00:00',
        requiredEndAt: '2026-07-08 18:00:00',
        constructionWindow: '每日22:00-次日06:00，动火和联动测试提前24小时报备',
        items: [
          {
            id: 'EC4-EPI-001',
            itemName: '排油烟支管接驳',
            itemDesc: '从L3-305铺位接入公共排油烟主立管，并完成防火封堵。',
            itemNote: '接驳前确认主立管口径、止回阀方向和防火封堵材料。',
            objectCount: 1,
            executionObjects: [
              { id: 'EC4-OBJ-001', name: 'L3-305排油烟支管', objectType: '排油烟管道', location: 'L3-305铺位吊顶内' }
            ]
          },
          {
            id: 'EC4-EPI-002',
            itemName: '防火阀与BA点位联动',
            itemDesc: '安装防火阀并接入BA监测点，完成消防联动和状态反馈测试。',
            itemNote: '联动测试需消防值班和BA工程师共同见证。',
            objectCount: 1,
            executionObjects: [
              { id: 'EC4-OBJ-002', name: 'L3-305排油烟防火阀', objectType: '防火阀/BA点位', location: 'L3餐饮管井' }
            ]
          }
        ],
        budgetTotal: '28,600.00 元',
        budgetSummary: '租户承担施工材料 14,800 + 租户施工人工 8,400 + 联动测试 3,200 + 物业复核 2,200',
        attachments: [
          { id: 'EC4-PA-001', fileName: 'L3-305排油烟接驳工程方案V1.0.pdf', fileType: 'PDF', fileSize: '8.9 MB', uploadTime: '2026-06-22 14:10:00', uploader: '陈凯' }
        ],
        safetyMeasures: '动火审批、吊顶内作业监护、消防联动测试报备和营业区围挡。',
        outageArrangement: '联动测试期间L3餐饮区排油烟风机短暂停机约20分钟。',
        acceptanceCriteria: '排风量达到设计值，防火阀动作和BA反馈正常，防火封堵合格，租户工程资料完整。'
      },
      execution: {
        executor: '租户施工方-海悦餐饮',
        executorTeam: '租户机电施工队',
        supplier: '租户施工方-海悦餐饮',
        actualStartAt: '待施工进场',
        actualEndAt: '未完成',
        constructionRecords: [
          { id: 'EC4-CR-001', recordDate: '2026-06-24', content: '租户施工方已确认接单，提交夜间施工人员名单和动火申请材料。', workers: '租户施工负责人、陈凯', duration: '0.5 小时' }
        ],
        progressRecords: [
          { id: 'EC4-PRG-001', recordDate: '2026-06-24', finishedItem: '承包商确认接单', itemProgress: '100%', overallProgress: '20%' }
        ],
        photos: [
          { id: 'EC4-CP-001', photoName: 'L3-305施工围挡确认', stage: '施工准备', shootTime: '2026-06-24 09:40:00', shooter: '陈凯' }
        ],
        problemRecords: [],
        changeRecords: [],
        safetyExecution: [
          { id: 'EC4-SAFE-001', safetyMeasure: '动火作业申请', status: '待审批', checker: '陈凯', checkTime: '待施工前' },
          { id: 'EC4-SAFE-002', safetyMeasure: '消防联动测试报备', status: '待提交', checker: '消防值班主管', checkTime: '待测试前' }
        ],
        actualLabor: [
          { id: 'EC4-AL-001', jobType: '租户机电工', actualHours: '0.00 人工时', workers: '待进场' }
        ],
        actualMaterial: [
          { id: 'EC4-AM-001', materialName: '排油烟镀锌风管', actualUsage: '待进场', purpose: '支管接驳' },
          { id: 'EC4-AM-002', materialName: '防火阀', actualUsage: '待进场', purpose: '消防联动' }
        ]
      },
      acceptance: {
        enabled: true,
        acceptor: '物业工程部+消防值班主管+招商运营部',
        acceptTime: '待施工完成',
        acceptMethod: '现场验收+联动测试+排风量复测',
        criteria: [
          { id: 'EC4-AC-001', standardItem: '排风量', requirement: '排风量达到餐饮铺位设计值', result: '未开始', resultNote: '-' },
          { id: 'EC4-AC-002', standardItem: '消防联动', requirement: '防火阀动作、BA反馈和消防联动记录正常', result: '未开始', resultNote: '-' }
        ],
        acceptanceResult: '未开始',
        resultNote: '-',
        rectificationRequirements: [],
        recheckRecords: [],
        photos: [],
        signatureRecords: []
      },
      cost: {
        budgetTotal: '28,600.00 元',
        actualTotal: '0.00 元',
        varianceAmount: '-28,600.00 元',
        varianceRate: '-100%',
        varianceReason: '租户施工方已确认，尚未进场施工',
        categoryCosts: [
          { id: 'EC4-CC-001', category: '租户施工人工', budgetAmount: '8,400.00 元', actualAmount: '0.00 元', varianceAmount: '-8,400.00 元', varianceRate: '-100%', varianceReason: '未进场' },
          { id: 'EC4-CC-002', category: '租户施工材料', budgetAmount: '14,800.00 元', actualAmount: '0.00 元', varianceAmount: '-14,800.00 元', varianceRate: '-100%', varianceReason: '未进场' },
          { id: 'EC4-CC-003', category: '联动测试', budgetAmount: '3,200.00 元', actualAmount: '0.00 元', varianceAmount: '-3,200.00 元', varianceRate: '-100%', varianceReason: '待测试' },
          { id: 'EC4-CC-004', category: '物业复核', budgetAmount: '2,200.00 元', actualAmount: '0.00 元', varianceAmount: '-2,200.00 元', varianceRate: '-100%', varianceReason: '待复核' }
        ],
        laborCosts: [],
        materialCosts: [],
        outsourcingFees: [
          { id: 'EC4-OF-001', supplier: '租户施工方-海悦餐饮', serviceContent: '排油烟接驳施工', contractAmount: '28,600.00 元', settlementAmount: '0.00 元', varianceAmount: '-28,600.00 元', paymentStatus: '租户承担' }
        ],
        otherFees: [],
        materialRequests: [],
        workHourRecords: [],
        contractNo: 'TENANT-CT-2026-0620-004',
        supplier: '租户施工方-海悦餐饮',
        contractAmount: '28,600.00 元',
        changeOrderAmount: '0.00 元',
        settlementAmount: '0.00 元',
        paidAmount: '0.00 元',
        unpaidAmount: '28,600.00 元',
        invoiceStatus: '租户自理',
        paymentMilestones: [
          { id: 'EC4-PMT-001', milestone: '租户工程验收后结算', ratio: '100%', payableAmount: '28,600.00 元', paidAmount: '0', payTime: '-', status: '待验收' }
        ],
        settlementStatus: '租户承担，待验收后登记',
        costCollectionStatus: '未归集',
        erpSyncStatus: '不涉及业主付款'
      },
      archive: {
        ...pendingEngineeringArchive('EC4'),
        ledgerEnabled: true,
        affectedObjects: [
          { id: 'EC4-AO-001', objectType: '空间/系统接口', objectName: 'L3-305海悦餐饮排油烟接驳点', impactType: '新增租户工程接驳记录' }
        ],
        updateContents: [
          { id: 'EC4-UC-001', objectName: 'L3-305铺位机电资料', beforeContent: '待租户装修接驳', afterContent: '待施工完成后记录排油烟支管、防火阀和BA点位', updateField: '租户工程资料、机电接口、竣工图纸' }
        ],
        updateResult: '待验收后更新',
        resultNote: '待租户工程验收通过后归档装修图纸、联动测试记录和排风量复测记录。'
      },
      workflowRecords: tenantEngineeringWorkflowRecords('承包商施工执行', 'EC4-WF', '2026-06-20 13:20:00')
    }
  })
)

function createEngineeringChangeSampleOrder(overrides) {
  return mergePlain(clonePlain(engineeringBaseOrder), overrides)
}

function pendingEngineeringArchive(prefix) {
  return {
    ledgerEnabled: false,
    affectedObjects: [],
    updateContents: [],
    updater: '待定',
    updateTime: '待验收通过',
    updateAttachments: [],
    updateResult: '未开始',
    resultNote: '-',
    archiveReady: false,
    archiveDocs: [
      { id: `${prefix}-AD-001`, docName: '改造方案', docType: '方案文件', copyCount: '1', medium: '电子', required: '是', archiveStatus: '待归档' },
      { id: `${prefix}-AD-002`, docName: '验收记录', docType: '验收资料', copyCount: '1', medium: '电子+纸质', required: '是', archiveStatus: '未生成' }
    ],
    handoverPerson: '待定',
    handoverTime: '待归档',
    receiver: '资料室',
    receiverDept: '工程部-资料室',
    receiveTime: '待归档',
    handoverNote: '-',
    requiredTotal: '2',
    archivedCount: '0',
    unarchivedCount: '2',
    archiveRate: '0%',
    missingDocs: '待流程后续节点生成',
    overallArchiveStatus: '未归档'
  }
}

function minorEngineeringWorkflowRecords(activeNodeName, prefix, createdAt) {
  return engineeringWorkflowRecordsFromSteps([
    { nodeName: 'PO创建/提交', nodeType: '开始', handler: '赵琳', handlerDept: '运营管理部', receiveTime: createdAt, handleTime: createdAt, duration: '30分钟', handleOpinion: '提交小型照明节能工程的工程范围、预算和施工窗口。' },
    { nodeName: '方案制定', nodeType: '执行', handler: '赵琳', handlerDept: '运营管理部', receiveTime: 'PO创建/提交后进入', handleTime: '已提交', duration: '1天', handleOpinion: '形成照明节能改造方案、预算口径、风险约束和审批资料。' },
    { nodeName: 'SO（支持审批人）审核', nodeType: '审批', handler: 'SO支持审批人', handlerDept: '工程部', receiveTime: 'PSC=否，已跳过', handleTime: '已跳过', duration: '-', handleOpinion: '本小型工程不需要SO支持审核，直接进入AO审批。' },
    { nodeName: 'AO（授权审批人）审批', nodeType: '审批', handler: '工程经理', handlerDept: '工程部', receiveTime: '方案提交后进入', handleTime: '待审批', duration: '进行中', handleOpinion: '审批小型工程的必要性、预算和夜间施工影响。' },
    { nodeName: 'SAP预算校验', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: 'AO审批通过后进入', handleTime: '未开始', duration: '-', handleOpinion: '校验预算科目与可用额度。' },
    { nodeName: '承包商确认接单', nodeType: '执行', handler: '工程部-强电班组', handlerDept: '工程部', receiveTime: 'SAP预算校验通过后进入', handleTime: '未开始', duration: '-', handleOpinion: '确认施工窗口、材料和现场作业要求。' },
    { nodeName: '承包商施工执行', nodeType: '执行', handler: '工程部-强电班组', handlerDept: '工程部', receiveTime: '承包商确认后进入', handleTime: '未开始', duration: '-', handleOpinion: '按施工窗口更换灯具并记录施工过程。' },
    { nodeName: 'PO完工认证', nodeType: '执行', handler: '工程主管', handlerDept: '工程部', receiveTime: '施工完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '确认完工数量、验收结果和费用。' },
    { nodeName: 'SAP付款处理', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: '完工认证后进入', handleTime: '未开始', duration: '-', handleOpinion: '处理付款和费用归集。' },
    { nodeName: '归档关闭', nodeType: '结束', handler: '系统', handlerDept: '系统节点', receiveTime: '付款完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '归档小型工程资料并关闭单据。' }
  ], activeNodeName, prefix)
}

function projectEngineeringWorkflowRecords(activeNodeName, prefix, createdAt) {
  return engineeringWorkflowRecordsFromSteps([
    { nodeName: 'PO创建/提交', nodeType: '开始', handler: '安全品质部', handlerDept: '安全品质部', receiveTime: createdAt, handleTime: createdAt, duration: '30分钟', handleOpinion: '提交防汛整改项目工程的范围、预算和施工窗口。' },
    { nodeName: '方案制定', nodeType: '执行', handler: '周鹏', handlerDept: '工程部', receiveTime: 'PO创建/提交后进入', handleTime: '已提交', duration: '1天', handleOpinion: '形成清淤、防水修复、蓄水观察和施工安全方案。' },
    { nodeName: 'SO（支持审批人）审核', nodeType: '审批', handler: '工程支持审批人', handlerDept: '工程部', receiveTime: '方案提交后进入', handleTime: '已通过', duration: '3小时', handleOpinion: '确认屋面防水、排水与施工安全可行性。' },
    { nodeName: 'AO（授权审批人）审批', nodeType: '审批', handler: '项目负责人', handlerDept: '安全品质部', receiveTime: 'SO支持通过后进入', handleTime: '已批准', duration: '3小时', handleOpinion: '确认预算、施工窗口和承包商安排。' },
    { nodeName: 'SAP预算校验', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: 'AO审批通过后进入', handleTime: '已通过', duration: '10分钟', handleOpinion: '预算校验通过，进入承包商施工执行。' },
    { nodeName: '承包商施工执行', nodeType: '执行', handler: '安辰防水工程', handlerDept: '外委承包商', receiveTime: '2026-06-26 08:00:00', handleTime: '进行中', duration: '进行中', handleOpinion: '承包商执行屋面清淤、防水收口修复和蓄水观察。' },
    { nodeName: 'PO完工认证', nodeType: '执行', handler: '安全品质部', handlerDept: '安全品质部', receiveTime: '施工完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '确认施工结果、蓄水观察记录和整改闭环。' },
    { nodeName: 'SAP付款处理', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: '完工认证后进入', handleTime: '未开始', duration: '-', handleOpinion: '处理外委付款和费用归集。' },
    { nodeName: '归档关闭', nodeType: '结束', handler: '系统', handlerDept: '系统节点', receiveTime: '付款完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '归档防汛整改资料并关闭单据。' }
  ], activeNodeName, prefix)
}

function capexEngineeringWorkflowRecords(activeNodeName, prefix, createdAt) {
  return engineeringWorkflowRecordsFromSteps([
    { nodeName: '创建', nodeType: '开始', handler: '系统', handlerDept: '-', receiveTime: createdAt, handleTime: createdAt, duration: '-', handleOpinion: 'CAPEX改造单据创建，承接资本项目立项。' },
    { nodeName: '方案制定', nodeType: '执行', handler: '张明', handlerDept: '工程部-暖通班组', receiveTime: '创建提交后进入', handleTime: '已提交', duration: '1天2小时', handleOpinion: '制定CAPEX改造范围、技术方案、工期计划、预算和采购需求。' },
    { nodeName: '技术审批', nodeType: '审批', handler: '工程经理', handlerDept: '工程部', receiveTime: '方案提交后进入', handleTime: '已通过', duration: '4小时', handleOpinion: '确认技术方案、设备选型和施工风险。' },
    { nodeName: '进度/成本审批', nodeType: '审批', handler: '项目负责人', handlerDept: '工程部', receiveTime: '技术审批通过后进入', handleTime: '已通过', duration: '5小时', handleOpinion: '确认项目进度、成本预算和施工窗口。' },
    { nodeName: '财务审批', nodeType: '审批', handler: '财务BP', handlerDept: '财务部', receiveTime: '进度/成本审批后进入', handleTime: '已通过', duration: '1天', handleOpinion: '确认CAPEX预算占用和付款规则。' },
    { nodeName: '采购PR', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: '财务审批通过后进入', handleTime: '已创建', duration: '10分钟', handleOpinion: '按审批后的工程方案创建采购申请。' },
    { nodeName: '采购PO入库', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: 'PR审批后进入', handleTime: '已完成', duration: '3天', handleOpinion: '完成采购PO和关键设备入库。' },
    { nodeName: '库存占用', nodeType: '系统', handler: '系统', handlerDept: '系统节点', receiveTime: 'PO入库后进入', handleTime: '已占用', duration: '30分钟', handleOpinion: '占用设备和施工辅材库存。' },
    { nodeName: '改造执行', nodeType: '执行', handler: '王建国', handlerDept: '工程部-暖通班组', receiveTime: '2026-06-25 08:00:00', handleTime: '进行中', duration: '进行中', handleOpinion: '按CAPEX改造方案实施空调系统更换并记录施工过程。' },
    { nodeName: '改造验收', nodeType: '执行', handler: '李建国', handlerDept: '工程部', receiveTime: '改造执行完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '按验收标准确认系统效果、资料、整改项和资产更新内容。' },
    { nodeName: 'SAP付款处理', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: '验收通过后进入', handleTime: '未开始', duration: '-', handleOpinion: '处理付款申请、批量复核和最终付款。' },
    { nodeName: '归档关闭', nodeType: '结束', handler: '系统', handlerDept: '系统节点', receiveTime: '付款完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '归档CAPEX改造资料并关闭单据。' }
  ], activeNodeName, prefix)
}

function tenantEngineeringWorkflowRecords(activeNodeName, prefix, createdAt) {
  return engineeringWorkflowRecordsFromSteps([
    { nodeName: 'PO创建/提交', nodeType: '开始', handler: '招商运营部', handlerDept: '招商运营部', receiveTime: createdAt, handleTime: createdAt, duration: '20分钟', handleOpinion: '提交租户铺位、工程范围、图纸和施工方信息。' },
    { nodeName: '方案制定', nodeType: '执行', handler: '招商运营部', handlerDept: '招商运营部', receiveTime: 'PO创建/提交后进入', handleTime: '已提交', duration: '1天', handleOpinion: '整理租户工程方案、费用、施工边界和资料。' },
    { nodeName: 'AO（授权审批人）审批', nodeType: '审批', handler: '工程经理', handlerDept: '工程部', receiveTime: '方案提交后进入', handleTime: '已批准', duration: '4小时', handleOpinion: '确认租户工程对公共系统和营业安全的影响。' },
    { nodeName: 'SAP预算校验', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: 'AO审批通过后进入', handleTime: '已跳过', duration: '-', handleOpinion: '租户承担施工费用，不占用业主预算。' },
    { nodeName: '承包商确认接单', nodeType: '执行', handler: '租户施工方-海悦餐饮', handlerDept: '租户施工方', receiveTime: 'SAP预算校验后进入', handleTime: '已确认', duration: '1小时', handleOpinion: '租户施工方确认施工窗口、人员名单和安全资料。' },
    { nodeName: '承包商施工执行', nodeType: '执行', handler: '租户施工方-海悦餐饮', handlerDept: '租户施工方', receiveTime: '2026-06-24 09:30:00', handleTime: '进行中', duration: '进行中', handleOpinion: '按审批方案执行排油烟接驳、防火阀联动和BA点位接入。' },
    { nodeName: 'PO完工认证', nodeType: '执行', handler: '物业工程部', handlerDept: '工程部', receiveTime: '施工完成后进入', handleTime: '未开始', duration: '-', handleOpinion: '复核排风量、防火封堵、联动测试和租户工程资料。' },
    { nodeName: 'SAP付款处理', nodeType: '系统', handler: 'SAP', handlerDept: '系统节点', receiveTime: '完工认证后进入', handleTime: '未开始', duration: '-', handleOpinion: '租户承担费用，仅登记工程成本与结算状态。' },
    { nodeName: '归档关闭', nodeType: '结束', handler: '系统', handlerDept: '系统节点', receiveTime: '资料齐套后进入', handleTime: '未开始', duration: '-', handleOpinion: '归档租户工程资料并关闭单据。' }
  ], activeNodeName, prefix)
}

function engineeringWorkflowRecords(activeNodeName, prefix, createdAt) {
  return projectEngineeringWorkflowRecords(activeNodeName, prefix, createdAt)
}

function engineeringWorkflowRecordsFromSteps(steps, activeNodeName, prefix) {
  const activeIndex = Math.max(0, steps.findIndex(item => item.nodeName === activeNodeName))
  return steps.map((step, index) => {
    const status = index < activeIndex ? '已完成' : index === activeIndex ? '进行中' : '未开始'
    const nextNode = steps[index + 1]?.nodeName || '-'
    return {
      id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
      nodeName: step.nodeName,
      nodeType: step.nodeType,
      handler: step.handler,
      handlerDept: step.handlerDept,
      receiveTime: index <= activeIndex ? step.receiveTime : `待${steps[index - 1]?.nodeName || '前置节点'}完成`,
      handleTime: status === '已完成' ? step.handleTime : status === '进行中' ? '进行中' : '未开始',
      duration: status === '已完成' ? step.duration : status === '进行中' ? '进行中' : '-',
      nodeStatus: status,
      handleOpinion: step.handleOpinion,
      nextNode,
      active: status === '进行中'
    }
  })
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function mergePlain(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(target?.[key])) {
      mergePlain(target[key], value)
    } else {
      target[key] = clonePlain(value)
    }
  })
  return target
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

const defaultOrder = orders[0]
const order = computed(() => {
  const found = orders.find(item => item.orderNo === route.params.orderNo) || defaultOrder
  return {
    ...found,
    attachments: [
      { name: '现场照片-处理前', type: '图片', size: '2.4MB' },
      { name: '节点提交记录', type: '文件', size: '128KB' }
    ],
    timeline: [
      { node: '提交/生成', time: '2026-06-16 09:00:00', desc: '单据进入流程。', active: false },
      { node: '分配调度', time: '2026-06-16 09:10:00', desc: '已分配当前责任人。', active: false },
      { node: found.currentNode, time: '当前', desc: '等待当前节点处理。', active: true }
    ],
    relations: [
      { type: '来源', code: 'SRC-20260616-009', desc: '上游计划、报事、申请或台账来源' },
      { type: '派生', code: 'REL-20260616-002', desc: '后续维修、整改、工程或资产关系' }
    ],
    logs: [
      { action: '创建单据', operator: '系统', time: '2026-06-16 09:00:00', desc: '根据来源创建单据。' },
      { action: '分配处理人', operator: '工程主管', time: '2026-06-16 09:10:00', desc: '分配当前节点责任人。' },
      { action: '更新节点状态', operator: found.owner, time: '2026-06-16 10:20:00', desc: '当前节点处理中。' }
    ]
  }
})

const tabs = [
  { id: 'common', value: 'common', name: '公共信息' },
  { id: 'typeInfo', value: 'typeInfo', name: '类型信息' },
  { id: 'flow', value: 'flow', name: '流程轨迹' },
  { id: 'relations', value: 'relations', name: '关联单据' },
  { id: 'logs', value: 'logs', name: '操作记录' }
]

const inspectionRecordTabs = [
  { id: 'plan', value: 'plan', name: '巡检计划' },
  { id: 'route', value: 'route', name: '路线与对象' },
  { id: 'checkIn', value: 'checkIn', name: '打卡记录' },
  { id: 'execution', value: 'execution', name: '执行记录' },
  { id: 'problemRepair', value: 'problemRepair', name: '问题与维修记录' },
  { id: 'cost', value: 'cost', name: '成本信息' },
  { id: 'sla', value: 'sla', name: 'SLA评估' },
  { id: 'flow', value: 'flow', name: '流程记录' }
]

const maintenanceRecordTabs = [
  { id: 'plan', value: 'plan', name: '维保计划' },
  { id: 'checkIn', value: 'checkIn', name: '打卡记录' },
  { id: 'execution', value: 'execution', name: '执行记录' },
  { id: 'maintenanceAcceptance', value: 'maintenanceAcceptance', name: '验收记录' },
  { id: 'problemRepair', value: 'problemRepair', name: '问题与维修记录' },
  { id: 'cost', value: 'cost', name: '成本信息' },
  { id: 'sla', value: 'sla', name: 'SLA评估' },
  { id: 'flow', value: 'flow', name: '流程记录' }
]

const repairRecordTabs = [
  { id: 'fault', value: 'fault', name: '故障信息' },
  { id: 'diagnosis', value: 'diagnosis', name: '诊断排查' },
  { id: 'plan', value: 'plan', name: '维修方案' },
  { id: 'repairExecution', value: 'repairExecution', name: '执行记录' },
  { id: 'repairAcceptance', value: 'repairAcceptance', name: '验收记录' },
  { id: 'cost', value: 'cost', name: '成本信息' },
  { id: 'sla', value: 'sla', name: 'SLA评估' },
  { id: 'flow', value: 'flow', name: '流程记录' }
]

const engineeringChangeRecordTabs = [
  { id: 'demand', value: 'demand', name: '改造需求' },
  { id: 'survey', value: 'survey', name: '现场勘查' },
  { id: 'plan', value: 'plan', name: '改造方案' },
  { id: 'engineeringExecution', value: 'engineeringExecution', name: '执行记录' },
  { id: 'acceptance', value: 'acceptance', name: '验收记录' },
  { id: 'cost', value: 'cost', name: '成本' },
  { id: 'archive', value: 'archive', name: '台账与归档' },
  { id: 'flow', value: 'flow', name: '流程记录' }
]

const planCostTabs = [
  { id: 'labor', value: 'labor', name: '计划人力成本' },
  { id: 'material', value: 'material', name: '计划物资使用' },
  { id: 'other', value: 'other', name: '计划其他费用' }
]

const moreOptions = [
  { label: '查看历史版本', key: 'history' },
  { label: '作废', key: 'void' }
]

const recordMoreOptions = [
  { label: '转交', key: 'transfer' },
  { label: '导出详情', key: 'export' }
]

const summaryItems = computed(() => {
  if (order.value.workType === 'inspection') {
    return [
      { label: '工单编码', value: order.value.orderNo },
      { label: '工作分类', value: order.value.classification },
      { label: '当前状态', value: statusLabel(order.value.status) },
      { label: '当前节点', value: order.value.currentNode },
      { label: '完成统计', value: `${order.value.progress.finishedCount}/${order.value.progress.taskTotal}` },
      { label: '异常统计', value: `${order.value.progress.abnormalCount} 异常 / ${order.value.progress.overSymptomCount} 超征兆` }
    ]
  }

  return [
    { label: '基础工作类型', value: workTypeLabel(order.value.workType) },
    { label: '工作分类', value: order.value.classification },
    { label: '来源', value: order.value.source },
    { label: '对象位置', value: order.value.objectLocation },
    { label: '当前节点', value: order.value.currentNode },
    { label: '当前责任', value: order.value.owner }
  ]
})

const commonInfo = computed(() => {
  if (order.value.workType === 'inspection') {
    return [
      { label: '编码', value: order.value.orderNo },
      { label: '名称', value: order.value.title },
      { label: '基础工作类型', value: workTypeLabel(order.value.workType) },
      { label: '工作分类', value: order.value.classification },
      { label: '创建时间', value: order.value.createdAt },
      { label: '项目组织', value: '某商业综合体 / 工程部 / 消防专业班组' }
    ]
  }

  return [
    { label: '单据编号', value: order.value.orderNo },
    { label: '单据状态', value: statusLabel(order.value.status) },
    { label: '项目组织', value: '某商业综合体 / 工程部 / 专业班组' },
    { label: '优先级与时限', value: `${slaLabel(order.value.slaStatus)} · ${order.value.targetFinishAt}` },
    { label: '来源信息', value: order.value.source },
    { label: '对象位置', value: order.value.objectLocation }
  ]
})

const isEngineeringChangeDetail = computed(() => order.value.workType === 'engineeringChange')
const isInspectionDetail = computed(() => order.value.workType === 'inspection')
const isMaintenanceDetail = computed(() => order.value.workType === 'maintenance')
const isRepairDetail = computed(() => order.value.workType === 'repair')
const isWorkRecordDetail = computed(() => workRecordTypes.includes(order.value.workType))

const recordTabs = computed(() => {
  if (isEngineeringChangeDetail.value) return engineeringChangeRecordTabs
  if (order.value.workType === 'repair') return repairRecordTabs
  if (order.value.workType === 'maintenance') return maintenanceRecordTabs
  return inspectionRecordTabs
})

const engineeringDetail = computed(() => order.value.engineeringDetail || {})

const recordDetail = computed(() => {
  const detail = order.value.recordDetail || order.value.inspectionDetail || emptyRecordDetail
  return {
    ...emptyRecordDetail,
    ...detail,
    sourcePlan: {
      ...emptyRecordDetail.sourcePlan,
      ...(detail.sourcePlan || {}),
      costPlan: {
        ...emptyRecordDetail.sourcePlan.costPlan,
        ...(detail.sourcePlan?.costPlan || {})
      }
    },
    routes: {
      ...emptyRecordDetail.routes,
      ...(detail.routes || {})
    },
    executionRecords: {
      ...emptyRecordDetail.executionRecords,
      ...(detail.executionRecords || {})
    },
    fault: {
      ...emptyRecordDetail.fault,
      ...(detail.fault || {})
    },
    diagnosis: {
      ...emptyRecordDetail.diagnosis,
      ...(detail.diagnosis || {})
    },
    repairPlan: {
      ...emptyRecordDetail.repairPlan,
      ...(detail.repairPlan || {})
    },
    repairExecution: {
      ...emptyRecordDetail.repairExecution,
      ...(detail.repairExecution || {}),
      recoveryVerification: {
        ...emptyRecordDetail.repairExecution.recoveryVerification,
        ...(detail.repairExecution?.recoveryVerification || {})
      }
    },
    acceptance: {
      ...emptyRecordDetail.acceptance,
      ...(detail.acceptance || {})
    },
    costInfo: {
      ...emptyRecordDetail.costInfo,
      ...(detail.costInfo || {})
    }
  }
})

const activeRecordTab = computed(() => {
  const current = normalizeTabValue(recordTab.value)
  if (recordTabs.value.some(item => item.value === current)) return current
  return recordTabs.value[0]?.value || 'checkIn'
})
const activePlanCostTab = computed(() => normalizeTabValue(planCostTab.value))

watch(
  () => order.value.workType,
  () => {
    recordTab.value = recordTabs.value[0]?.value || 'checkIn'
  },
  { immediate: true }
)

const recordSummaryFields = computed(() => {
  if (isEngineeringChangeDetail.value) {
    return [
      field('单据编号', order.value.orderNo),
      field('单据名称', order.value.title),
      field('工作分类', order.value.classification),
      field('来源', order.value.source),
      field('改造对象', order.value.targetObject || order.value.objectLocation),
      field('创建时间', order.value.createdAt),
      field('申请人', order.value.applicant)
    ]
  }

  if (isInspectionDetail.value) {
    return [
      field('单据编号', order.value.orderNo),
      field('单据名称', order.value.title),
      field('工作分类', order.value.classification),
      field('来源', order.value.source),
      field('巡检计划', recordDetail.value.sourcePlan.planName),
      field('巡检批次', recordDetail.value.sourcePlan.planBatch),
      field('巡检范围', order.value.inspectionScope || order.value.objectLocation),
      field('创建时间', order.value.createdAt),
      field('当前责任人', order.value.owner)
    ]
  }

  if (isMaintenanceDetail.value) {
    return [
      field('单据编号', order.value.orderNo),
      field('单据名称', order.value.title),
      field('工作分类', order.value.classification),
      field('来源', order.value.source),
      field('维保计划', recordDetail.value.sourcePlan.planName),
      field('维保对象', order.value.objectLocation),
      field('供应商', order.value.supplier),
      field('合同编号', order.value.contractNo),
      field('创建时间', order.value.createdAt),
      field('当前责任人', order.value.owner)
    ]
  }

  if (isRepairDetail.value) {
    return [
      field('单据编号', order.value.orderNo),
      field('单据名称', order.value.title),
      field('工作分类', order.value.classification),
      field('来源', order.value.source),
      field('关联来源单据', order.value.relatedSourceOrder),
      field('故障对象', order.value.faultObject || recordDetail.value.fault.faultObject),
      field('对象位置', order.value.objectLocation),
      field('影响范围', order.value.impactScope || recordDetail.value.fault.impactScope),
      field('创建时间', order.value.createdAt),
      field('当前责任人', order.value.owner)
    ]
  }

  return [
    field('编码', order.value.orderNo),
    field('名称', order.value.title),
    field('工作分类', order.value.classification),
    field('创建时间', order.value.createdAt)
  ]
})

const recordPlanBaseFields = computed(() => {
  if (isInspectionDetail.value) {
    return [
      field('计划名称', recordDetail.value.sourcePlan.planName),
      field('计划批次', recordDetail.value.sourcePlan.planBatch),
      field('来源', order.value.source),
      field('巡检范围', order.value.inspectionScope || order.value.objectLocation),
      field('标准工时', recordDetail.value.sourcePlan.standardLaborHours),
      field('标准工时公式', recordDetail.value.sourcePlan.standardLaborFormula)
    ]
  }

  if (isMaintenanceDetail.value) {
    return [
      field('计划名称', recordDetail.value.sourcePlan.planName),
      field('计划批次', recordDetail.value.sourcePlan.planBatch),
      field('维保级别', recordDetail.value.sourcePlan.maintenanceLevel),
      field('来源', order.value.source),
      field('维保对象', order.value.objectLocation),
      field('供应商', order.value.supplier),
      field('合同编号', order.value.contractNo),
      field('报告要求', recordDetail.value.sourcePlan.reportRequirement)
    ]
  }

  if (isRepairDetail.value) {
    const plan = recordDetail.value.repairPlan
    return [
      field('是否启用独立方案', plan.enabled ? '是' : '否'),
      field('方案名称', plan.planName),
      field('方案概述', plan.planSummary),
      field('维修方式', plan.repairMethod),
      field('审批状态', plan.approvalStatus)
    ]
  }

  return [
    field('计划名称', recordDetail.value.sourcePlan.planName),
    field('计划批次', recordDetail.value.sourcePlan.planBatch)
  ]
})

const recordPlanTimeFields = computed(() => {
  if (isRepairDetail.value) {
    const plan = recordDetail.value.repairPlan
    return [
      field('要求开始时间', plan.requiredStartAt),
      field('要求结束时间', plan.requiredEndAt),
      field('停机窗口', plan.outageWindow),
      field('风险措施', plan.riskMeasures),
      field('验收标准', plan.acceptanceCriteria)
    ]
  }

  const fields = [
    field('要求开始时间', recordDetail.value.sourcePlan.requiredStartAt),
    field('要求结束时间', recordDetail.value.sourcePlan.requiredEndAt)
  ]
  if (isMaintenanceDetail.value) {
    fields.push(
      field('停机窗口', recordDetail.value.sourcePlan.outageWindow),
      field('安全要求', recordDetail.value.sourcePlan.safetyRequirement)
    )
  }
  return fields
})

const routeObjectSummaryFields = computed(() => {
  const planned = recordDetail.value.routes?.planned || []
  const actual = recordDetail.value.routes?.actual || []
  return [
    field('计划路线点', `${planned.length} 个`),
    field('实际经过点', `${actual.length} 次`),
    field('巡检范围', order.value.inspectionScope || order.value.objectLocation),
    field('路线偏差说明', recordDetail.value.routes?.routeDeviationNote || '无路线偏差')
  ]
})

const costSummaryItems = computed(() => {
  const summary = recordDetail.value.costInfo?.summary || {}
  return [
    { label: '计划总成本', value: summary.plannedTotalCost || '-', note: '人力 + 物资 + 其他' },
    { label: '实际总成本', value: summary.actualTotalCost || '-', note: '执行后归集' },
    { label: '成本差异', value: summary.costVariance || '-', note: '实际 - 计划' },
    { label: '差异原因', value: summary.varianceReason || '-', note: recordDetail.value.costInfo.erpSyncStatus ? `ERP：${recordDetail.value.costInfo.erpSyncStatus}` : '按记录追溯' }
  ]
})

const planBaseTitle = computed(() => {
  if (isInspectionDetail.value) return '巡检计划基础信息'
  if (isMaintenanceDetail.value) return '维保计划基础信息'
  if (isRepairDetail.value) return '维修方案基础信息'
  return '计划基础信息'
})

const planBaseHint = computed(() => {
  if (isInspectionDetail.value) return '按计划、批次、范围和标准工时识别当前巡检单来源。'
  if (isMaintenanceDetail.value) return '按计划、级别、对象、供应商和合同识别当前维保单来源。'
  if (isRepairDetail.value) return '维修单从故障诊断进入方案，简单维修也需保留处理措施和恢复标准。'
  return '按名称和批次识别当前单据来源。'
})

const strategySectionTitle = computed(() => {
  if (isInspectionDetail.value) return '巡检事项'
  if (isMaintenanceDetail.value) return '维保事项'
  if (isRepairDetail.value) return '维修事项'
  return '事项'
})

const planRequirementTitle = computed(() => {
  if (isInspectionDetail.value) return '打卡要求'
  if (isMaintenanceDetail.value) return '打卡与作业要求'
  if (isRepairDetail.value) return '维修资源计划'
  return '执行要求'
})

const planRequirementHint = computed(() => {
  if (isInspectionDetail.value) return '未配置强制打卡时显示空态；如有实际打卡仍在打卡记录页签展示。'
  if (isMaintenanceDetail.value) return '展示维保打卡要求，作业标准、报告要求在计划基础信息展示。'
  if (isRepairDetail.value) return '维修方案中的人力、物料和工具计划在成本计划内展示。'
  return '当前计划下的执行要求主要为打卡规则。'
})

const workflowTableHint = computed(() => {
  if (isInspectionDetail.value) return '按巡检流程配置展示节点轨迹，派生维修只记录派生结果，不阻塞巡检关闭。'
  if (isMaintenanceDetail.value) return '按维保流程配置展示节点轨迹，维保验收作为统一验收节点。'
  if (isRepairDetail.value) return '按维修流程配置展示异常核实、诊断排查、方案、执行和验收节点。'
  return '按流程配置展示节点轨迹。'
})

const recordProgressMetrics = computed(() => {
  if (isEngineeringChangeDetail.value) {
    return [
      metric('当前状态', order.value.progress?.statusText || statusLabel(order.value.status), '状态', 'neutral'),
      metric('当前节点', order.value.currentNode, '节点', 'neutral'),
      metric('当前责任人', order.value.owner, '责任', 'neutral')
    ]
  }

  if (isInspectionDetail.value) {
    const progress = order.value.progress || {}
    return [
      metric('当前状态', progress.statusText || statusLabel(order.value.status), '状态', 'neutral'),
      metric('当前节点', order.value.currentNode, '节点', 'neutral'),
      metric('当前责任人', order.value.owner, '责任', 'neutral'),
      metric('检查项总数', progress.taskTotal ?? 0, '总数', 'neutral'),
      metric('已完成数', progress.finishedCount ?? 0, '已完成', 'success'),
      metric('未完成数', progress.unfinishedCount ?? 0, '待完成', 'warning'),
      metric('异常数', progress.abnormalCount ?? 0, '异常记录', 'danger'),
      metric('无法执行数', progress.unexecutableCount ?? 0, '无法执行记录', 'muted'),
      metric('超征兆数', progress.overSymptomCount ?? 0, '阈值告警', 'danger')
    ]
  }

  if (isMaintenanceDetail.value) {
    const progress = order.value.progress || {}
    return [
      metric('当前状态', progress.statusText || statusLabel(order.value.status), '状态', 'neutral'),
      metric('当前节点', order.value.currentNode, '节点', 'neutral'),
      metric('当前责任人', order.value.owner, '责任', 'neutral'),
      metric('作业项总数', progress.taskTotal ?? 0, '总数', 'neutral'),
      metric('已完成数', progress.finishedCount ?? 0, '已完成', 'success'),
      metric('未完成数', progress.unfinishedCount ?? 0, '待完成', 'warning'),
      metric('异常数', progress.abnormalCount ?? 0, '问题记录', 'danger'),
      metric('无法执行数', progress.unexecutableCount ?? 0, '无法执行记录', 'muted'),
      metric('验收结论', recordDetail.value.acceptance?.acceptanceResult || '-', '验收', 'warning')
    ]
  }

  if (isRepairDetail.value) {
    const progress = order.value.progress || {}
    return [
      metric('当前状态', progress.statusText || statusLabel(order.value.status), '状态', 'danger'),
      metric('当前节点', order.value.currentNode, '节点', 'neutral'),
      metric('当前责任人', order.value.owner, '责任', 'neutral'),
      metric('紧急程度', order.value.urgencyLevel, '优先级', 'danger'),
      metric('故障状态', order.value.faultStatus, '故障', 'warning'),
      metric('恢复状态', order.value.recoveryStatus, '恢复', 'warning'),
      metric('验收结论', order.value.acceptanceResult || recordDetail.value.acceptance?.acceptanceResult || '-', '验收', 'muted')
    ]
  }

  return [
    metric('当前状态', order.value.progress?.statusText || statusLabel(order.value.status), '状态', 'neutral'),
    metric('当前节点', order.value.currentNode, '节点', 'neutral'),
    metric('当前责任人', order.value.owner, '责任', 'neutral'),
    metric('完成统计', `${order.value.progress?.finishedCount ?? 0}/${order.value.progress?.taskTotal ?? 0}`, '已完成/总数', 'success'),
    metric('异常统计', `${order.value.progress?.abnormalCount ?? 0} 异常 / ${order.value.progress?.overSymptomCount ?? 0} 超征兆`, '异常口径', 'danger'),
    metric('无法执行', order.value.progress?.unexecutableCount ?? 0, '无法执行记录', 'muted')
  ]
})

const repairFaultFields = computed(() => {
  const fault = recordDetail.value.fault || {}
  return [
    field('来源类型', fault.sourceType || order.value.source),
    field('来源单据', joinList(fault.relatedOrders)),
    field('报修人/发现人', fault.reporter),
    field('联系方式', fault.contactPhone),
    field('故障对象', fault.faultObject || order.value.faultObject),
    field('对象类型', fault.objectType),
    field('故障现象', fault.symptom),
    field('影响范围', fault.impactScope || order.value.impactScope),
    field('风险等级', fault.riskLevel),
    field('首次发现时间', fault.discoveredAt),
    field('初始处置', fault.initialAction)
  ]
})

const repairVerifyFields = computed(() => {
  const diagnosis = recordDetail.value.diagnosis || {}
  return [
    field('核实人', diagnosis.verifier),
    field('到场时间', diagnosis.arrivalAt),
    field('核实结论', diagnosis.verifyResult)
  ]
})

const repairDiagnosisFields = computed(() => {
  const diagnosis = recordDetail.value.diagnosis || {}
  return [
    field('诊断人', diagnosis.diagnoser),
    field('诊断时间', diagnosis.diagnosedAt),
    field('故障原因', diagnosis.rootCause),
    field('故障部位', diagnosis.faultPart),
    field('影响系统', joinList(diagnosis.affectedSystems)),
    field('是否外委', diagnosis.needOutsource ? '是' : '否'),
    field('是否待料', diagnosis.waitingMaterial ? '是' : '否'),
    field('处理路径', diagnosis.handlingPath)
  ]
})

const recoveryVerificationFields = computed(() => {
  const verification = recordDetail.value.repairExecution?.recoveryVerification || {}
  return [
    field('验证方式', verification.method),
    field('验证开始时间', verification.startAt),
    field('验证结束时间', verification.endAt),
    field('验证结果', verification.result),
    field('验证说明', verification.note),
    field('复发条件', verification.reopenCondition)
  ]
})

const actualMaterialAndToolRecords = computed(() => [
  ...(recordDetail.value.repairExecution?.actualMaterial || []),
  ...(recordDetail.value.repairExecution?.actualTools || [])
])

const acceptanceBaseFields = computed(() => {
  const acceptance = recordDetail.value.acceptance || {}
  return [
    field('验收人', acceptance.acceptor),
    field('验收时间', acceptance.acceptTime),
    field('验收方式', acceptance.acceptMethod),
    field('验收结论', acceptance.acceptanceResult),
    field('结论说明', acceptance.resultNote)
  ]
})

const acceptanceRequirementRecords = computed(() => {
  const acceptance = recordDetail.value.acceptance || {}
  const records = isRepairDetail.value
    ? (acceptance.reworkRequirements || [])
    : (acceptance.rectificationRequirements || [])
  return records.map(item => ({
    ...item,
    rectificationItem: item.rectificationItem || item.reworkItem || item.requirement || '-'
  }))
})

const engineeringDemandSourceFields = computed(() => {
  const demand = engineeringDetail.value.demand || {}
  return [
    field('需求来源', demand.demandSource),
    field('关联单据', joinList(demand.relatedOrders)),
    field('申请人', demand.applicant),
    field('申请部门', demand.applicantDept),
    field('申请时间', demand.applyTime)
  ]
})

const engineeringTargetFields = computed(() => {
  const demand = engineeringDetail.value.demand || {}
  return [
    field('改造对象', demand.targetObject),
    field('对象类型', demand.objectType),
    field('改造范围', demand.changeScope)
  ]
})

const engineeringDemandDescFields = computed(() => {
  const demand = engineeringDetail.value.demand || {}
  return [
    field('现状问题', demand.currentProblem),
    field('改造目标', demand.changeTarget),
    field('期望完成时间', demand.expectedFinishDate)
  ]
})

const engineeringSurveyFields = computed(() => {
  const survey = engineeringDetail.value.survey || {}
  return [
    field('勘查人', survey.surveyor),
    field('勘查时间', survey.surveyTime),
    field('现场现状', survey.siteCondition)
  ]
})

const engineeringImpactFields = computed(() => {
  const survey = engineeringDetail.value.survey || {}
  return [
    field('影响范围', survey.impactScope),
    field('受影响系统', joinList(survey.affectedSystems)),
    field('受影响区域', joinList(survey.affectedAreas)),
    field('受影响商户', joinList(survey.affectedTenants))
  ]
})

const engineeringRiskFields = computed(() => {
  const survey = engineeringDetail.value.survey || {}
  return [
    field('安全风险', survey.safetyRisk),
    field('停机/断电影响', survey.outageImpact),
    field('施工限制', survey.constructionLimits)
  ]
})

const engineeringSurveyConclusionFields = computed(() => {
  const survey = engineeringDetail.value.survey || {}
  return [
    field('评估结论', survey.surveyConclusion),
    field('结论说明', survey.conclusionNote)
  ]
})

const engineeringPlanBaseFields = computed(() => {
  const plan = engineeringDetail.value.plan || {}
  return [
    field('方案名称', plan.planName),
    field('方案概述', plan.planSummary),
    field('方案版本', plan.planVersion),
    field('审批状态', plan.approvalStatus)
  ]
})

const engineeringPlanTimeFields = computed(() => {
  const plan = engineeringDetail.value.plan || {}
  return [
    field('要求开始时间', plan.requiredStartAt),
    field('要求结束时间', plan.requiredEndAt),
    field('施工窗口', plan.constructionWindow)
  ]
})

const engineeringPlanBudgetItems = computed(() => {
  const plan = engineeringDetail.value.plan || {}
  return [
    { label: '预算总额', value: plan.budgetTotal || '-', note: '方案预算总金额' },
    { label: '预算构成摘要', value: plan.budgetSummary || '-', note: '按成本页签查看明细' },
    { label: '明细入口', value: '成本页签', note: '点击下方链接跳转' }
  ]
})

const engineeringPlanSafetyFields = computed(() => {
  const plan = engineeringDetail.value.plan || {}
  return [
    field('安全措施', plan.safetyMeasures),
    field('停机安排', plan.outageArrangement),
    field('验收标准', plan.acceptanceCriteria)
  ]
})

const engineeringExecutionBaseFields = computed(() => {
  const execution = engineeringDetail.value.execution || {}
  return [
    field('执行人', execution.executor),
    field('执行班组', execution.executorTeam),
    field('供应商', execution.supplier),
    field('实际开始时间', execution.actualStartAt),
    field('实际结束时间', execution.actualEndAt)
  ]
})

const engineeringAcceptanceBaseFields = computed(() => {
  const acceptance = engineeringDetail.value.acceptance || {}
  return [
    field('验收人', acceptance.acceptor),
    field('验收时间', acceptance.acceptTime),
    field('验收方式', acceptance.acceptMethod)
  ]
})

const engineeringAcceptanceResultFields = computed(() => {
  const acceptance = engineeringDetail.value.acceptance || {}
  return [
    field('验收结论', acceptance.acceptanceResult),
    field('结论说明', acceptance.resultNote)
  ]
})

const engineeringCostSummaryItems = computed(() => {
  const cost = engineeringDetail.value.cost || {}
  return [
    { label: '预算总额', value: cost.budgetTotal || '-', note: '预算总金额' },
    { label: '实际总额', value: cost.actualTotal || '-', note: '实际总金额' },
    { label: '差异金额', value: cost.varianceAmount || '-', note: cost.varianceRate || '差异率' },
    { label: '差异原因', value: cost.varianceReason || '-', note: '实际 - 预算' }
  ]
})

const engineeringContractFields = computed(() => {
  const cost = engineeringDetail.value.cost || {}
  return [
    field('合同编号', cost.contractNo),
    field('供应商', cost.supplier),
    field('合同金额', cost.contractAmount),
    field('变更签证金额', cost.changeOrderAmount),
    field('结算金额', cost.settlementAmount),
    field('已付金额', cost.paidAmount),
    field('未付金额', cost.unpaidAmount),
    field('发票状态', cost.invoiceStatus)
  ]
})

const engineeringSettlementFields = computed(() => {
  const cost = engineeringDetail.value.cost || {}
  return [
    field('费用结算状态', cost.settlementStatus),
    field('成本归集状态', cost.costCollectionStatus),
    field('ERP同步状态', cost.erpSyncStatus)
  ]
})

const engineeringUpdateFields = computed(() => {
  const archive = engineeringDetail.value.archive || {}
  return [
    field('更新人', archive.updater),
    field('更新时间', archive.updateTime),
    field('更新结果', archive.updateResult),
    field('结果说明', archive.resultNote)
  ]
})

const engineeringHandoverFields = computed(() => {
  const archive = engineeringDetail.value.archive || {}
  return [
    field('移交人', archive.handoverPerson),
    field('移交时间', archive.handoverTime),
    field('接收人', archive.receiver),
    field('接收部门', archive.receiverDept),
    field('接收时间', archive.receiveTime),
    field('移交说明', archive.handoverNote)
  ]
})

const engineeringArchiveCompletenessFields = computed(() => {
  const archive = engineeringDetail.value.archive || {}
  return [
    field('必须归档总数', archive.requiredTotal),
    field('已归档数量', archive.archivedCount),
    field('未归档数量', archive.unarchivedCount),
    field('归档完整率', archive.archiveRate),
    field('缺失资料说明', archive.missingDocs),
    field('整体归档状态', archive.overallArchiveStatus)
  ]
})

const executionRepairRecords = computed(() => recordDetail.value.executionRecords?.repairs || [])

const selectedStrategyObjects = computed(() => selectedStrategyItem.value?.executionObjects || [])
const strategyObjectModalTitle = computed(() => {
  const itemName = selectedStrategyItem.value?.name || selectedStrategyItem.value?.itemName
  return itemName ? tx('{name} - 执行对象明细', { name: itemName }) : tx('执行对象明细')
})

const strategyItemColumns = [
  { dataIndex: 'name', title: '策略事项名称' },
  { dataIndex: 'type', title: '事项类型', width: 100 },
  { dataIndex: 'objectTypes', title: '对象类型', width: 160 },
  { dataIndex: 'executionObjects', title: '执行对象', width: 120 }
]

const planLaborCostColumns = [
  { dataIndex: 'costItem', title: '成本项' },
  { dataIndex: 'plannedLaborHour', title: '计划人工时', width: 130 },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 120 },
  { dataIndex: 'basis', title: '计算口径' }
]

const planMaterialUsageColumns = [
  { dataIndex: 'skuName', title: 'SKU名称' },
  { dataIndex: 'materialType', title: '物资类型', width: 110 },
  { dataIndex: 'plannedQuantity', title: '计划使用量', width: 130 },
  { dataIndex: 'materialSituation', title: '物料情况' }
]

const planOtherFeeColumns = [
  { dataIndex: 'feeName', title: '费用项' },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 120 },
  { dataIndex: 'remark', title: '说明' }
]

const strategyObjectColumns = [
  { dataIndex: 'name', title: '设备设施名称' },
  { dataIndex: 'objectType', title: '对象类型', width: 120 },
  { dataIndex: 'location', title: '位置（建筑-楼层-空间）' }
]

const engineeringAttachmentColumns = [
  { dataIndex: 'fileName', title: '附件名称' },
  { dataIndex: 'fileType', title: '附件类型', width: 120 },
  { dataIndex: 'fileSize', title: '文件大小', width: 120 },
  { dataIndex: 'uploadTime', title: '上传时间', width: 180 }
]

const engineeringAttachmentColumnsWithUploader = [
  ...engineeringAttachmentColumns,
  { dataIndex: 'uploader', title: '上传人', width: 120 }
]

const engineeringPhotoColumns = [
  { dataIndex: 'photoName', title: '照片名称' },
  { dataIndex: 'photo', title: '照片缩略图', width: 120 },
  { dataIndex: 'shootTime', title: '拍摄时间', width: 180 }
]

const engineeringPlanItemColumns = [
  { dataIndex: 'itemName', title: '事项名称', width: 180 },
  { dataIndex: 'itemDesc', title: '事项描述' },
  { dataIndex: 'itemNote', title: '事项说明' },
  { dataIndex: 'executionObjects', title: '执行对象', width: 120 }
]

const engineeringConstructionRecordColumns = [
  { dataIndex: 'recordDate', title: '记录日期', width: 140 },
  { dataIndex: 'content', title: '施工内容' },
  { dataIndex: 'workers', title: '施工人员', width: 180 },
  { dataIndex: 'duration', title: '施工时长', width: 120 }
]

const engineeringProgressRecordColumns = [
  { dataIndex: 'recordDate', title: '记录日期', width: 140 },
  { dataIndex: 'finishedItem', title: '完成事项' },
  { dataIndex: 'itemProgress', title: '完成比例', width: 120 },
  { dataIndex: 'overallProgress', title: '总体进度', width: 120 }
]

const engineeringConstructionPhotoColumns = [
  { dataIndex: 'photoName', title: '照片名称' },
  { dataIndex: 'photo', title: '照片', width: 120 },
  { dataIndex: 'stage', title: '拍摄阶段', width: 120 },
  { dataIndex: 'shootTime', title: '拍摄时间', width: 180 },
  { dataIndex: 'shooter', title: '拍摄人', width: 120 }
]

const engineeringProblemColumns = [
  { dataIndex: 'problemDesc', title: '问题描述' },
  { dataIndex: 'foundAt', title: '发现时间', width: 180 },
  { dataIndex: 'foundBy', title: '发现人', width: 110 },
  { dataIndex: 'handlingMethod', title: '处理方式' },
  { dataIndex: 'status', title: '处理状态', width: 120 }
]

const engineeringChangeColumns = [
  { dataIndex: 'changeContent', title: '变更内容' },
  { dataIndex: 'changeReason', title: '变更原因' },
  { dataIndex: 'changeTime', title: '变更时间', width: 180 },
  { dataIndex: 'approvalNo', title: '变更审批', width: 170 },
  { dataIndex: 'approvalStatus', title: '审批状态', width: 120 }
]

const engineeringSafetyColumns = [
  { dataIndex: 'safetyMeasure', title: '安全措施' },
  { dataIndex: 'status', title: '执行情况', width: 120 },
  { dataIndex: 'checker', title: '检查人', width: 110 },
  { dataIndex: 'checkTime', title: '检查时间', width: 180 }
]

const engineeringActualLaborColumns = [
  { dataIndex: 'jobType', title: '工种' },
  { dataIndex: 'actualHours', title: '实际工时' },
  { dataIndex: 'workers', title: '人员' }
]

const engineeringActualMaterialColumns = [
  { dataIndex: 'materialName', title: '物料名称' },
  { dataIndex: 'actualUsage', title: '实际用量' },
  { dataIndex: 'purpose', title: '用途' }
]

const engineeringAcceptanceCriteriaColumns = [
  { dataIndex: 'standardItem', title: '标准项', width: 160 },
  { dataIndex: 'requirement', title: '标准要求' },
  { dataIndex: 'result', title: '验收结果', width: 130 },
  { dataIndex: 'resultNote', title: '结果说明' }
]

const engineeringRectificationColumns = [
  { dataIndex: 'rectificationItem', title: '整改事项' },
  { dataIndex: 'deadline', title: '整改期限', width: 140 },
  { dataIndex: 'owner', title: '整改责任人', width: 130 },
  { dataIndex: 'status', title: '整改状态', width: 120 }
]

const engineeringRecheckColumns = [
  { dataIndex: 'recheckTime', title: '复验时间', width: 180 },
  { dataIndex: 'rechecker', title: '复验人', width: 120 },
  { dataIndex: 'conclusion', title: '复验结论', width: 120 },
  { dataIndex: 'note', title: '复验说明' }
]

const engineeringAcceptancePhotoColumns = [
  { dataIndex: 'photoName', title: '照片名称' },
  { dataIndex: 'photo', title: '照片', width: 120 },
  { dataIndex: 'shootTime', title: '拍摄时间', width: 180 },
  { dataIndex: 'shooter', title: '拍摄人', width: 120 }
]

const engineeringSignatureColumns = [
  { dataIndex: 'signer', title: '签字人', width: 120 },
  { dataIndex: 'role', title: '签字角色', width: 140 },
  { dataIndex: 'signTime', title: '签字时间', width: 180 },
  { dataIndex: 'opinion', title: '签字意见' },
  { dataIndex: 'signature', title: '电子签名', width: 140 }
]

const engineeringCostCategoryColumns = [
  { dataIndex: 'category', title: '费用类别', width: 120 },
  { dataIndex: 'budgetAmount', title: '预算金额', width: 130 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 130 },
  { dataIndex: 'varianceAmount', title: '差异金额', width: 120 },
  { dataIndex: 'varianceRate', title: '差异率', width: 100 },
  { dataIndex: 'varianceReason', title: '差异原因' }
]

const engineeringLaborCostColumns = [
  { dataIndex: 'jobType', title: '工种', width: 120 },
  { dataIndex: 'plannedHours', title: '计划工时', width: 130 },
  { dataIndex: 'actualHours', title: '实际工时', width: 130 },
  { dataIndex: 'hourVariance', title: '工时差异', width: 110 },
  { dataIndex: 'unitPrice', title: '单价', width: 140 },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 130 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 130 },
  { dataIndex: 'amountVariance', title: '金额差异', width: 120 }
]

const engineeringMaterialCostColumns = [
  { dataIndex: 'materialName', title: '物料名称', width: 170 },
  { dataIndex: 'spec', title: '规格型号', width: 150 },
  { dataIndex: 'plannedQty', title: '计划数量', width: 110 },
  { dataIndex: 'actualQty', title: '实际数量', width: 110 },
  { dataIndex: 'qtyVariance', title: '数量差异', width: 110 },
  { dataIndex: 'unitPrice', title: '单价', width: 130 },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 130 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 130 },
  { dataIndex: 'amountVariance', title: '金额差异', width: 120 }
]

const engineeringOutsourcingCostColumns = [
  { dataIndex: 'supplier', title: '供应商' },
  { dataIndex: 'serviceContent', title: '服务内容' },
  { dataIndex: 'contractAmount', title: '合同金额', width: 130 },
  { dataIndex: 'settlementAmount', title: '结算金额', width: 130 },
  { dataIndex: 'varianceAmount', title: '差异金额', width: 120 },
  { dataIndex: 'paymentStatus', title: '付款状态', width: 120 }
]

const engineeringOtherFeeColumns = [
  { dataIndex: 'feeName', title: '费用项' },
  { dataIndex: 'budgetAmount', title: '预算金额', width: 130 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 130 },
  { dataIndex: 'varianceAmount', title: '差异金额', width: 120 },
  { dataIndex: 'note', title: '说明' }
]

const engineeringMaterialReqColumns = [
  { dataIndex: 'materialReqNo', title: '领料单号', width: 160 },
  { dataIndex: 'materialName', title: '物料名称', width: 120 },
  { dataIndex: 'reqQuantity', title: '领用数量', width: 110 },
  { dataIndex: 'usedQuantity', title: '实际使用', width: 110 },
  { dataIndex: 'returnQuantity', title: '退库数量', width: 110 },
  { dataIndex: 'reqPerson', title: '领用人', width: 100 },
  { dataIndex: 'reqTime', title: '领用时间', width: 180 }
]

const engineeringWorkHourColumns = [
  { dataIndex: 'workDate', title: '日期', width: 120 },
  { dataIndex: 'jobType', title: '工种', width: 100 },
  { dataIndex: 'worker', title: '人员', width: 120 },
  { dataIndex: 'workHours', title: '工时', width: 110 },
  { dataIndex: 'workContent', title: '工作内容' },
  { dataIndex: 'recorder', title: '记录人', width: 100 }
]

const engineeringPaymentColumns = [
  { dataIndex: 'milestone', title: '节点' },
  { dataIndex: 'ratio', title: '付款比例', width: 110 },
  { dataIndex: 'payableAmount', title: '应付金额', width: 130 },
  { dataIndex: 'paidAmount', title: '实付金额', width: 130 },
  { dataIndex: 'payTime', title: '付款时间', width: 130 },
  { dataIndex: 'status', title: '状态', width: 100 }
]

const engineeringAffectedObjectColumns = [
  { dataIndex: 'objectType', title: '对象类型', width: 120 },
  { dataIndex: 'objectName', title: '对象名称' },
  { dataIndex: 'impactType', title: '影响类型', width: 140 }
]

const engineeringUpdateContentColumns = [
  { dataIndex: 'objectName', title: '对象名称', width: 180 },
  { dataIndex: 'beforeContent', title: '更新前内容' },
  { dataIndex: 'afterContent', title: '更新后内容' },
  { dataIndex: 'updateField', title: '更新字段', width: 180 }
]

const engineeringUpdateAttachmentColumns = [
  { dataIndex: 'fileName', title: '附件名称' },
  { dataIndex: 'fileType', title: '附件类型', width: 120 },
  { dataIndex: 'uploadTime', title: '上传时间', width: 180 }
]

const engineeringArchiveDocColumns = [
  { dataIndex: 'docName', title: '资料名称' },
  { dataIndex: 'docType', title: '资料类型', width: 130 },
  { dataIndex: 'copyCount', title: '份数', width: 90 },
  { dataIndex: 'medium', title: '介质', width: 130 },
  { dataIndex: 'required', title: '是否必须', width: 110 },
  { dataIndex: 'archiveStatus', title: '归档状态', width: 120 }
]

const engineeringFlowColumns = [
  { dataIndex: 'nodeName', title: '节点名称', width: 180 },
  { dataIndex: 'nodeType', title: '节点类型', width: 100 },
  { dataIndex: 'handler', title: '处理人', width: 110 },
  { dataIndex: 'handlerDept', title: '处理人部门', width: 160 },
  { dataIndex: 'receiveTime', title: '接收时间', width: 170 },
  { dataIndex: 'handleTime', title: '处理时间', width: 170 },
  { dataIndex: 'duration', title: '处理时长', width: 120 },
  { dataIndex: 'nodeStatus', title: '节点状态', width: 120 },
  { dataIndex: 'handleOpinion', title: '处理意见' },
  { dataIndex: 'nextNode', title: '下一节点', width: 180 }
]

const workRecordFlowColumns = [
  { dataIndex: 'nodeName', title: '节点名称', width: 170 },
  { dataIndex: 'nodeType', title: '节点类型', width: 100 },
  { dataIndex: 'handler', title: '处理人', width: 110 },
  { dataIndex: 'handlerDept', title: '处理人部门', width: 160 },
  { dataIndex: 'receiveTime', title: '接收时间', width: 170 },
  { dataIndex: 'handleTime', title: '处理时间', width: 150 },
  { dataIndex: 'duration', title: '处理时长', width: 110 },
  { dataIndex: 'nodeStatus', title: '节点状态', width: 110 },
  { dataIndex: 'handleOpinion', title: '处理意见' },
  { dataIndex: 'nextNode', title: '下一节点', width: 130 }
]

const inspectionFlowColumns = workRecordFlowColumns

const simpleAttachmentColumns = [
  { dataIndex: 'fileName', title: '附件名称' },
  { dataIndex: 'fileType', title: '附件类型', width: 120 },
  { dataIndex: 'uploadTime', title: '上传时间', width: 170 },
  { dataIndex: 'uploader', title: '上传人', width: 120 }
]

const acceptanceCriteriaColumns = [
  { dataIndex: 'standardItem', title: '标准项', width: 140 },
  { dataIndex: 'requirement', title: '标准要求' },
  { dataIndex: 'result', title: '验收结果', width: 120 },
  { dataIndex: 'resultNote', title: '结果说明' }
]

const acceptanceRequirementColumns = [
  { dataIndex: 'rectificationItem', title: '整改/返工事项' },
  { dataIndex: 'deadline', title: '期限', width: 130 },
  { dataIndex: 'owner', title: '责任人', width: 120 },
  { dataIndex: 'status', title: '状态', width: 110 }
]

const recheckRecordColumns = [
  { dataIndex: 'recheckTime', title: '复验时间', width: 170 },
  { dataIndex: 'rechecker', title: '复验人', width: 120 },
  { dataIndex: 'conclusion', title: '复验结论', width: 120 },
  { dataIndex: 'note', title: '复验说明' }
]

const signatureRecordColumns = [
  { dataIndex: 'signer', title: '签字人', width: 120 },
  { dataIndex: 'role', title: '签字角色', width: 130 },
  { dataIndex: 'signTime', title: '签字时间', width: 170 },
  { dataIndex: 'opinion', title: '签字意见' }
]

const repairExecutionRecordColumns = [
  { dataIndex: 'executor', title: '执行人', width: 110 },
  { dataIndex: 'executorTeam', title: '执行班组', width: 120 },
  { dataIndex: 'supplier', title: '供应商', width: 130 },
  { dataIndex: 'actualStartAt', title: '实际开始时间', width: 170 },
  { dataIndex: 'actualEndAt', title: '实际结束时间', width: 140 },
  { dataIndex: 'repairObject', title: '维修对象', width: 170 },
  { dataIndex: 'repairMeasure', title: '维修措施' },
  { dataIndex: 'repairResult', title: '处理结果', width: 120 },
  { dataIndex: 'photo', title: '记录照片', width: 160 }
]

const actualLaborColumns = [
  { dataIndex: 'jobType', title: '工种', width: 110 },
  { dataIndex: 'workers', title: '人员', width: 130 },
  { dataIndex: 'actualHours', title: '实际工时', width: 120 },
  { dataIndex: 'sourceRecord', title: '来源记录' }
]

const actualMaterialColumns = [
  { dataIndex: 'materialName', title: '物料/工具' },
  { dataIndex: 'materialType', title: '类型', width: 90 },
  { dataIndex: 'actualUsage', title: '实际用量', width: 110 },
  { dataIndex: 'purpose', title: '用途' }
]

const outsourcingRecordColumns = [
  { dataIndex: 'supplier', title: '供应商', width: 140 },
  { dataIndex: 'serviceContent', title: '服务内容' },
  { dataIndex: 'arrivalAt', title: '到场时间', width: 160 },
  { dataIndex: 'feedback', title: '反馈' }
]

const plannedRouteColumns = [
  { dataIndex: 'routeNo', title: '路线序号', width: 90 },
  { dataIndex: 'spaceName', title: '空间名称' },
  { dataIndex: 'building', title: '所在建筑' },
  { dataIndex: 'floor', title: '所在楼层' }
]

const actualRouteColumns = [
  { dataIndex: 'routeNo', title: '序号', width: 80 },
  { dataIndex: 'spaceName', title: '空间' },
  { dataIndex: 'location', title: '建筑-楼层' },
  { dataIndex: 'executedAt', title: '执行时间' }
]

const checkInRecordColumns = [
  { dataIndex: 'checkInUser', title: '打卡人' },
  { dataIndex: 'checkInAt', title: '打卡时间' },
  { dataIndex: 'method', title: '打卡方式', width: 110 },
  { dataIndex: 'objectName', title: '打卡对象' },
  { dataIndex: 'attachment', title: '打卡附件' }
]

const inspectionRecordColumns = [
  { dataIndex: 'objectName', title: '对象名称' },
  { dataIndex: 'strategyItem', title: '策略事项' },
  { dataIndex: 'resultCategory', title: '结果分类', width: 110 },
  { dataIndex: 'selectedOption', title: '选择的选项' },
  { dataIndex: 'remark', title: '备注' },
  { dataIndex: 'photo', title: '拍照' }
]

const meterReadingColumns = [
  { dataIndex: 'objectName', title: '对象名称' },
  { dataIndex: 'objectType', title: '对象类型', width: 110 },
  { dataIndex: 'meterPoint', title: '抄录点位' },
  { dataIndex: 'readingResult', title: '抄录结果', width: 120 },
  { dataIndex: 'recordedAt', title: '抄录时间' }
]

const problemRepairColumns = [
  { dataIndex: 'objectName', title: '对象名称' },
  { dataIndex: 'objectType', title: '对象类型', width: 110 },
  { dataIndex: 'problemDescription', title: '问题描述' },
  { dataIndex: 'problemStatus', title: '问题状态', width: 120 },
  { dataIndex: 'repairRecord', title: '维修记录' }
]

const unableRecordColumns = [
  { dataIndex: 'instanceName', title: '实例' },
  { dataIndex: 'objectType', title: '对象类型', width: 110 },
  { dataIndex: 'strategyItem', title: '策略事项' },
  { dataIndex: 'reasonCategory', title: '原因分类', width: 120 },
  { dataIndex: 'reasonDesc', title: '原因描述' },
  { dataIndex: 'feedback', title: '反馈人/时间' }
]

const laborCostColumns = [
  { dataIndex: 'costItem', title: '成本项' },
  { dataIndex: 'plannedUsage', title: '计划人工时', width: 130 },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 120 },
  { dataIndex: 'actualUsage', title: '实际人工时', width: 130 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 120 },
  { dataIndex: 'variance', title: '差异', width: 110 },
  { dataIndex: 'sourceRecord', title: '来源记录' }
]

const materialCostColumns = [
  { dataIndex: 'skuName', title: 'SKU名称' },
  { dataIndex: 'materialType', title: '物资类型', width: 110 },
  { dataIndex: 'plannedQuantity', title: '计划使用量', width: 130 },
  { dataIndex: 'actualQuantity', title: '实际使用量', width: 130 },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 120 },
  { dataIndex: 'actualAmount', title: '实际金额', width: 120 },
  { dataIndex: 'variance', title: '差异', width: 110 },
  { dataIndex: 'result', title: '对比结果' }
]

const otherCostColumns = [
  { dataIndex: 'feeName', title: '费用项', width: 130 },
  { dataIndex: 'plannedContent', title: '计划内容' },
  { dataIndex: 'plannedAmount', title: '计划金额', width: 120 },
  { dataIndex: 'actualContent', title: '实际内容' },
  { dataIndex: 'actualAmount', title: '实际金额', width: 120 },
  { dataIndex: 'variance', title: '差异', width: 110 },
  { dataIndex: 'sourceRecord', title: '来源记录' }
]

const slaEvaluationColumns = [
  { dataIndex: 'ruleName', title: 'SLA规则' },
  { dataIndex: 'ruleContent', title: '匹配规则内容' },
  { dataIndex: 'actualSituation', title: '实际情况' },
  { dataIndex: 'result', title: '评估结果', width: 110 }
]

const typedDetail = computed(() => ({
  title: tx(order.value.detailTitle),
  hint: tx(order.value.detailHint),
  sections: order.value.detailSections
}))

function section(title, tag, tagType, fields) {
  return { title, tag, tagType, fields }
}

function field(label, value) {
  return { label, value: value ?? '-' }
}

function metric(label, value, note, tone = 'neutral') {
  return { label, value: value ?? '-', note, tone }
}

function joinList(value) {
  if (Array.isArray(value)) return value.length ? value.join(' / ') : '-'
  return value || '-'
}

function normalizeTabValue(value) {
  if (value && typeof value === 'object') {
    return value.id || value.value
  }
  return value
}

function attachmentThumb(label, tone = 'default') {
  const palettes = {
    default: ['#dbeafe', '#93c5fd', '#2563eb'],
    after: ['#dcfce7', '#86efac', '#16a34a']
  }
  const [background, accent, foreground] = palettes[tone] || palettes.default
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="8" fill="${background}"/><path d="M10 50l15-17 11 11 8-9 18 15v10H10z" fill="${accent}"/><circle cx="51" cy="21" r="7" fill="${foreground}" opacity=".75"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function workTypeLabel(value) {
  return tx(workTypeOptions.find(item => item.value === value)?.label || value)
}

function statusLabel(value) {
  return tx(statusOptions.find(item => item.value === value)?.label || value)
}

function slaLabel(value) {
  return tx(slaOptions.find(item => item.value === value)?.label || value)
}

function resultTagType(value) {
  if (value === '异常') return 'error'
  if (value === '超征兆') return 'rejected'
  return 'completed'
}

function statusTextTagType(value) {
  if (['已完成', '合格', '已执行', '已通过', '已归档', '已付'].includes(value)) return 'completed'
  if (['不合格', '同步失败', '资料不全'].includes(value)) return 'error'
  if (['待处理', '待整改', '待归档', '待付', '有条件通过', '部分归档'].includes(value)) return 'rejected'
  if (['进行中', '处理中', '整改中', '结算中', '同步中'].includes(value)) return 'processing'
  if (['不适用', '已跳过', '未开始'].includes(value)) return 'canceled'
  return 'processing'
}

function strategyObjectTypes(item) {
  const types = (item.executionObjects || [])
    .map(object => object.objectType)
    .filter(Boolean)
  return Array.from(new Set(types)).join('、') || '-'
}

function openStrategyObjects(item) {
  selectedStrategyItem.value = item
  strategyObjectModalVisible.value = true
}

function goBack() {
  router.push({ name: 'workOrders' })
}

function handleMoreAction() {}
</script>

<style scoped>
.detail-page {
  min-height: calc(100vh - 48px);
  padding: var(--padding-6);
  background:
    linear-gradient(180deg, #eef3f8 0, #f6f8fb 280px),
    var(--gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--padding-4);
}

.detail-header,
.detail-title-group,
.detail-actions,
.detail-main,
.block-header,
.relation-card {
  display: flex;
  align-items: center;
}

.detail-header {
  justify-content: space-between;
  gap: var(--padding-4);
}

.detail-title-group {
  gap: var(--padding-3);
  min-width: 0;
}

.page-title {
  margin: 0;
  color: var(--title-color);
  font-size: var(--font-xl);
  line-height: var(--line-xl);
  font-weight: 600;
}

.detail-title-group p,
.type-page-hint {
  margin: var(--padding-1) 0 0;
  color: var(--notes-color);
}

.detail-actions {
  gap: var(--padding-2);
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--padding-3);
}

.detail-summary article,
.detail-content-panel,
.detail-side-panel,
.type-section,
.inspection-block,
.attachment-card,
.relation-card,
.log-list article,
.side-card {
  background: var(--gray-0);
  border-radius: var(--xl-radius);
  box-shadow: var(--shadow-1);
}

.detail-summary article {
  padding: var(--padding-3);
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.detail-summary span,
.info-grid span,
.type-field-grid span,
.side-card span,
.attachment-card span,
.relation-card span,
.log-list span {
  color: var(--notes-color);
  font-size: var(--font-m);
}

.detail-summary strong,
.info-grid strong,
.type-field-grid strong,
.side-card strong,
.attachment-card strong,
.relation-card strong,
.log-list strong {
  color: var(--title-color);
}

.detail-main {
  align-items: stretch;
  gap: var(--padding-4);
  min-height: 0;
}

.detail-main--inspection {
  display: block;
}

.detail-content-panel {
  flex: 1;
  min-width: 0;
  padding: var(--padding-4);
}

.detail-main--inspection .detail-content-panel {
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.detail-side-panel {
  width: 320px;
  align-self: flex-start;
  padding: var(--padding-4);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.detail-tab-body {
  margin-top: var(--padding-4);
}

.info-grid,
.type-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--padding-3);
}

.info-grid {
  margin: var(--padding-3) 0 var(--padding-4);
}

.info-grid article,
.type-field-grid article {
  background: var(--gray-100);
  border-radius: var(--big-radius);
  padding: var(--padding-3);
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.attachment-list,
.type-section-list,
.inspection-detail-stack,
.relation-list,
.log-list,
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
  margin-top: var(--padding-3);
}

.attachment-card,
.type-section,
.relation-card,
.log-list article {
  padding: var(--padding-3);
}

.block-header,
.relation-card {
  justify-content: space-between;
  gap: var(--padding-3);
}

.type-field-grid {
  margin-top: var(--padding-3);
}

.inspection-block {
  padding: var(--padding-4);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(31, 42, 55, 0.08);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.inspection-page-body,
.inspection-overview {
  display: flex;
  flex-direction: column;
  gap: var(--padding-4);
}

.inspection-overview {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
}

.inspection-block--base {
  background:
    linear-gradient(135deg, rgba(237, 246, 255, 0.72), rgba(255, 255, 255, 0.92) 46%),
    var(--gray-0);
}

.inspection-tab-panel {
  padding: 0;
}

.inspection-tab-body {
  margin-top: 0;
  padding: var(--padding-5) var(--padding-4) var(--padding-4);
}

.inspection-tab-panel :deep(.m-tabs) {
  padding: 0 var(--padding-4);
  border-bottom: 1px solid var(--gray-200);
  background: rgba(248, 250, 252, 0.92);
}

.inspection-tab-panel :deep(.m-tabs-item) {
  height: 52px;
}

.inspection-tab-panel :deep(.m-tabs-name) {
  font-weight: 600;
}

.inspection-overview .inspection-info-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.inspection-overview .metric-strip {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inspection-block-head,
.inspection-block-head > div,
.inspection-subsection-head,
.inspection-flow-head,
.inspection-flow-meta {
  display: flex;
  align-items: center;
  gap: var(--padding-2);
}

.inspection-block-head,
.inspection-subsection-head {
  justify-content: space-between;
}

.inspection-block-head > div > span {
  width: var(--line-xxl);
  height: var(--line-xxl);
  border-radius: var(--round-radius);
  background: var(--blue-50);
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.inspection-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--padding-3);
  margin-top: var(--padding-4);
}

.inspection-info-grid--compact {
  margin-top: 0;
}

.inspection-info-grid--wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inspection-info-grid article,
.metric-card {
  background: rgba(246, 248, 251, 0.92);
  border: 1px solid rgba(31, 42, 55, 0.06);
  border-radius: 8px;
  padding: var(--padding-3);
}

.inspection-info-grid article,
.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.inspection-info-grid span,
.metric-card span,
.metric-card em,
.inspection-subsection-head span,
.inspection-flow-meta,
.inspection-flow-item p {
  color: var(--notes-color);
  font-size: var(--font-m);
  font-style: normal;
}

.inspection-info-grid strong,
.metric-card strong,
.inspection-subsection-head strong,
.inspection-block-head strong,
.inspection-flow-head strong {
  color: var(--title-color);
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--padding-3);
  margin-top: var(--padding-3);
}

.cost-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--padding-3);
  margin-bottom: var(--padding-5);
}

.cost-summary-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 0;
}

.cost-summary-card {
  min-height: 74px;
  padding: var(--padding-3);
  border: 1px solid rgba(31, 42, 55, 0.08);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(237, 246, 255, 0.72), rgba(255, 255, 255, 0.96)),
    var(--gray-0);
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.plan-cost-panel {
  overflow: hidden;
  border: 1px solid rgba(31, 42, 55, 0.1);
  border-radius: 8px;
  background: var(--gray-0);
}

.plan-cost-panel :deep(.m-tabs) {
  padding: 0 var(--padding-3);
  border-bottom: 1px solid var(--gray-200);
  background: #f8fafc;
}

.plan-cost-panel :deep(.m-tabs-item) {
  height: 44px;
}

.plan-cost-body {
  padding: var(--padding-3);
}

.plan-cost-pane-head {
  margin-bottom: var(--padding-3);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--padding-3);
}

.plan-cost-pane-head strong {
  color: var(--title-color);
  font-size: var(--font-l);
  line-height: var(--line-l);
}

.plan-cost-pane-head span {
  color: var(--notes-color);
  font-size: var(--font-m);
}

.plan-empty-table {
  overflow: hidden;
  border: 1px solid rgba(31, 42, 55, 0.12);
  border-radius: 8px;
  background: var(--gray-0);
}

.plan-empty-table-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px minmax(0, 1fr);
  gap: var(--padding-3);
  padding: var(--padding-3);
  background: #f3f6f9;
  color: var(--notes-color);
  font-size: var(--font-m);
  font-weight: 600;
}

.plan-empty-box {
  padding: var(--padding-5);
  border-top: 1px dashed var(--gray-300);
  background: #f8fafc;
  color: var(--notes-color);
  text-align: center;
}

.state-inline {
  padding: var(--padding-5);
  border: 1px dashed var(--gray-300);
  border-radius: 8px;
  background: var(--gray-100);
  color: var(--notes-color);
  text-align: center;
}

.metric-card {
  border-left: 3px solid var(--gray-300);
  min-height: 70px;
}

.metric-card strong {
  font-size: var(--font-xl);
  line-height: var(--line-xl);
}

.cost-summary-card strong {
  color: var(--title-color);
  font-size: var(--font-xl);
  line-height: var(--line-xl);
}

.cost-summary-card span,
.cost-summary-card em {
  color: var(--notes-color);
  font-style: normal;
}

.metric-card--success {
  border-left-color: var(--success-color);
}

.metric-card--warning {
  border-left-color: var(--warning-color);
}

.metric-card--danger {
  border-left-color: var(--danger-color);
}

.metric-card--muted {
  border-left-color: var(--notes-color);
}

.inspection-subsection {
  margin-top: var(--padding-4);
}

.inspection-subsection--no-top {
  margin-top: 0;
}

.execution-section-stack {
  display: flex;
  flex-direction: column;
  gap: var(--padding-6);
}

.execution-section-stack .inspection-subsection {
  margin-top: 0;
  padding-top: var(--padding-4);
  border-top: 1px solid var(--gray-200);
}

.execution-section-stack .inspection-subsection:first-child {
  padding-top: 0;
  border-top: 0;
}

.inspection-subsection-head {
  margin-bottom: var(--padding-3);
  align-items: flex-end;
}

.inspection-subsection-head strong {
  position: relative;
  padding-left: var(--padding-2);
  font-size: var(--font-l);
  line-height: var(--line-l);
}

.inspection-subsection-head strong::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 3px;
  border-radius: 3px;
  background: var(--primary-color);
}

.inspection-table-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--padding-5);
}

.inspection-table-grid--dual {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.inspection-table-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.engineering-inline-table {
  margin-top: var(--padding-3);
}

.table-wrap {
  background: var(--gray-0);
  box-shadow: 0 0 0 1px rgba(31, 42, 55, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.table-wrap :deep(th) {
  background: #f3f6f9;
  color: var(--notes-color);
  font-weight: 600;
}

.table-wrap :deep(td) {
  border-color: var(--gray-200);
}

.thumbnail-list,
.repair-photo-row {
  display: flex;
  align-items: center;
  gap: var(--padding-2);
  flex-wrap: wrap;
}

.photo-thumb {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: var(--big-radius);
  background: var(--gray-100);
  box-shadow: 0 0 0 1px var(--gray-300);
  overflow: hidden;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.photo-thumb span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 4px;
  color: var(--gray-0);
  background: rgba(15, 23, 42, 0.62);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-thumb--after {
  box-shadow: 0 0 0 1px var(--success-color);
}

.repair-cell {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.repair-cell span {
  color: var(--notes-color);
}

.check-rule-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.check-rule-list li {
  background: rgba(246, 248, 251, 0.92);
  border: 1px solid rgba(31, 42, 55, 0.06);
  border-left: 3px solid var(--primary-color);
  border-radius: 8px;
  padding: var(--padding-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-3);
}

.check-rule-list li > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.check-rule-list strong {
  color: var(--title-color);
}

.check-rule-list span {
  color: var(--notes-color);
  font-size: var(--font-m);
}

.inspection-flow-timeline {
  margin-top: var(--padding-3);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.inspection-flow-item {
  position: relative;
  padding: var(--padding-3) var(--padding-3) var(--padding-3) var(--padding-8);
  background: rgba(246, 248, 251, 0.92);
  border: 1px solid rgba(31, 42, 55, 0.06);
  border-radius: 8px;
}

.inspection-flow-dot {
  position: absolute;
  left: var(--padding-4);
  top: var(--padding-5);
  width: var(--padding-2);
  height: var(--padding-2);
  border-radius: var(--round-radius);
  background: var(--gray-300);
}

.inspection-flow-item--active .inspection-flow-dot {
  background: var(--primary-color);
}

.inspection-flow-head {
  justify-content: space-between;
}

.inspection-flow-item p {
  margin: var(--padding-2) 0 0;
  line-height: var(--line-m);
}

.inspection-flow-meta {
  flex-wrap: wrap;
  margin-top: var(--padding-2);
}

.timeline-item p,
.log-list p {
  margin: var(--padding-2) 0 0;
  color: var(--notes-color);
}

.timeline-item {
  position: relative;
  padding: var(--padding-3) var(--padding-3) var(--padding-3) var(--padding-6);
  background: var(--gray-100);
  border-radius: var(--xl-radius);
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: var(--padding-3);
  top: var(--padding-4);
  width: var(--padding-2);
  height: var(--padding-2);
  border-radius: var(--round-radius);
  background: var(--gray-300);
}

.timeline-item--active::before {
  background: var(--primary-color);
}

.timeline-item span {
  color: var(--notes-color);
}

.side-card {
  padding: var(--padding-3);
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

@media (max-width: 1200px) {
  .inspection-overview,
  .inspection-table-grid,
  .inspection-table-grid--dual,
  .inspection-table-grid--three,
  .inspection-info-grid--wide,
  .cost-summary-grid--three {
    grid-template-columns: 1fr;
  }

  .inspection-info-grid,
  .inspection-overview .inspection-info-grid,
  .inspection-overview .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .detail-page {
    padding: var(--padding-3);
  }

  .detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .inspection-info-grid,
  .inspection-overview .inspection-info-grid,
  .inspection-overview .metric-strip {
    grid-template-columns: 1fr;
  }

  .inspection-block,
  .inspection-tab-panel {
    padding: var(--padding-3);
  }

  .inspection-tab-panel {
    padding: 0;
  }

  .inspection-tab-body {
    padding: var(--padding-4) var(--padding-3) var(--padding-3);
  }
}
</style>
