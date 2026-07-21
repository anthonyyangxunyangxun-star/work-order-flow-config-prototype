<template>
  <main class="workflow-page">
    <section class="workflow-shell">
      <aside class="workflow-left-panel">
        <header class="panel-header">
          <div>
            <h2>工作流程列表</h2>
          </div>
          <div class="list-actions">
            <template v-if="batchPublishMode">
              <m-button type="default" size="small" @click="cancelBatchPublish">取消</m-button>
              <m-button type="primary" size="small" :disabled="publishSelectedCount === 0" @click="publishSelectedWorkflows">发布选中</m-button>
            </template>
            <template v-else>
              <m-button type="default" size="small" @click="startBatchPublish">批量发布</m-button>
              <m-button type="primary" size="small" @click="openCreateWorkflowModal">新建流程</m-button>
            </template>
          </div>
        </header>

        <div class="workflow-list-tools">
          <m-search v-model="workflowKeyword" :width="'100%'" placeholder="搜索流程名称" />
          <m-select
            v-model="workflowFilter.classification"
            :options="toSelectOptions(classificationOptions)"
            prefix="工作分类："
            style="width: 100%;"
            placeholder="请选择"
            clearable
          />
        </div>

        <div class="workflow-tree">
          <section v-for="group in workflowTree" :key="group.value" class="tree-group">
            <header class="tree-group-head">
              <div>
                <strong>{{ group.label }}</strong>
                <span>{{ group.flowCount }} 个流程</span>
              </div>
            </header>
            <div class="tree-children">
              <article
                v-for="workflow in group.children"
                :key="workflow.workflowCode"
                class="tree-flow"
                :class="{ 'tree-flow--active': workflow.workflowCode === selectedWorkflow.workflowCode }"
                role="button"
                tabindex="0"
                @click="selectWorkflow(workflow)"
              >
                <div class="tree-flow-title">
                  <strong>{{ workflow.workflowName }}</strong>
                  <span v-if="batchPublishMode" class="publish-check" @click.stop>
                    <m-checkbox v-model="workflow.publishChecked" :size="14" @change="markPublishSelection" />
                  </span>
                  <m-button
                    v-else
                    type="link"
                    size="small"
                    class="tree-flow-delete"
                    :disabled="workflows.length <= 1"
                    @click.stop="requestDeleteWorkflow(workflow)"
                  >
                    删除
                  </m-button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </aside>

      <section class="workflow-canvas-panel">
        <header class="canvas-header">
          <div class="canvas-title">
            <h2>{{ selectedWorkflow.workflowName }}</h2>
          </div>
          <div class="canvas-actions">
            <m-button type="default" size="small" @click="refreshCanvas">刷新画布</m-button>
            <m-button type="default" size="small" @click="openValidationModal">校验流程</m-button>
          </div>
        </header>

        <div class="workflow-canvas" @click.self="closeNodeDetail">
          <div v-if="canvasNotice" class="canvas-notice">{{ canvasNotice }}</div>
          <div
            class="diagram-scroll"
            :class="{ 'diagram-scroll--dragging': canvasDragState.active }"
            @pointerdown="startCanvasDrag"
            @pointermove="dragCanvas"
            @pointerup="endCanvasDrag"
            @pointerleave="endCanvasDrag"
            @pointercancel="endCanvasDrag"
          >
            <div class="flow-layout" :style="flowLayoutStyle">
              <svg
                class="route-layer"
                :viewBox="`0 0 ${flowLayout.width} ${flowLayout.height}`"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="route-arrow-main"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path class="route-arrow-head route-arrow-head--main" d="M0,0 L8,4 L0,8 Z" />
                  </marker>
                  <marker
                    id="route-arrow-alt"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path class="route-arrow-head route-arrow-head--alt" d="M0,0 L8,4 L0,8 Z" />
                  </marker>
                </defs>
                <path
                  v-for="line in flowRouteLines"
                  :key="line.id"
                  class="route-path"
                  :class="`route-path--${line.kind}`"
                  :d="line.path"
                  :marker-end="line.kind === 'forward' ? 'url(#route-arrow-main)' : 'url(#route-arrow-alt)'"
                />
              </svg>
              <span
                v-for="label in flowRouteLabels"
                :key="label.id"
                class="route-link-card"
                :class="`route-link-card--${label.kind}`"
                :style="{ left: `${label.x}px`, top: `${label.y}px` }"
              >
                <strong>{{ label.text }}</strong>
              </span>
              <template v-for="nodeLayout in flowLayout.nodes" :key="nodeLayout.node.nodeCode">
                <article
                  class="flow-node"
                  :class="[
                    `flow-node--${nodeLayout.node.nodeType}`,
                    { 'flow-node--disabled': !nodeLayout.node.enabled, 'flow-node--selected': selectedElement?.id === nodeLayout.node.nodeCode }
                  ]"
                  :style="{ left: `${nodeLayout.x}px`, top: `${nodeLayout.y}px` }"
                  role="button"
                  tabindex="0"
                  @click.stop="openNodeDetail(nodeLayout.node)"
                >
                  <div class="node-main">
                    <strong class="node-name">{{ nodeLayout.node.nodeName }}</strong>
                    <span class="node-type-tag" :class="`node-type-tag--${nodeLayout.node.nodeType}`">
                      {{ nodeTypeLabel(nodeLayout.node.nodeType) }}
                    </span>
                    <span v-if="isCustomDiagramNode(nodeLayout.node)" class="custom-node-badge">【自定义】</span>
                    <span
                      v-if="flowNodeExecutorText(nodeLayout.node)"
                      class="node-executor-line"
                      :title="`执行人：${flowNodeExecutorText(nodeLayout.node)}`"
                    >
                      执行人：{{ flowNodeExecutorText(nodeLayout.node) }}
                    </span>
                  </div>
                  <m-tag v-if="!nodeLayout.node.enabled" type="canceled">停用</m-tag>
                </article>
              </template>
            </div>
          </div>
        </div>
      </section>

      <aside class="workflow-right-panel">
        <header class="panel-header panel-header--right">
          <div>
            <h2>流程业务配置</h2>
          </div>
          <m-tag v-if="strategyDirty" type="processing">未保存</m-tag>
        </header>

        <m-tabs v-model="activeWorkflowConfigTab" :data="workflowConfigTabs" class="workflow-config-tabs" />

        <div class="property-scroll">
          <section v-if="activeWorkflowConfigTab === 'basic'" class="property-card">
            <h3>基础信息</h3>
            <m-form :model="selectedWorkflow" label-position="left" label-width="96px">
              <m-form-item label="流程名称" required>
                <input
                  :value="selectedWorkflow.workflowName"
                  class="workflow-name-input"
                  placeholder="请输入流程名称"
                  @input="changeWorkflowName"
                  @change="changeWorkflowName"
                  @blur="changeWorkflowName"
                />
              </m-form-item>
              <m-form-item label="适用条件" class="condition-form-item">
                <div class="condition-builder">
                  <div v-if="selectedWorkflow.conditionRules.length === 0" class="condition-empty-state">
                    <span>未配置适用条件，作为该工作类型的默认流程。</span>
                    <m-button type="link" size="small" @click="addConditionRuleAfter(-1, selectedWorkflow)">添加条件</m-button>
                  </div>
                  <div v-for="(rule, index) in selectedWorkflow.conditionRules" :key="rule.id" class="condition-rule">
                    <div class="condition-relation-cell">
                      <m-select
                        v-if="index > 0"
                        v-model="rule.relation"
                        :options="toSelectOptions(relationOptions)"
                        :size="96"
                        placeholder="关系"
                        @change="changeConditionValue(rule, selectedWorkflow)"
                      />
                      <span v-else class="condition-relation-placeholder">当</span>
                    </div>
                    <div class="condition-field-cell">
                      <m-select
                        v-model="rule.field"
                        :options="toSelectOptions(conditionFieldOptionsFor(selectedWorkflow))"
                        :size="136"
                        placeholder="条件主体"
                        @change="changeConditionField(rule, selectedWorkflow)"
                      />
                    </div>
                    <div class="condition-operator-cell">
                      <m-select
                        v-model="rule.operator"
                        :options="toSelectOptions(conditionOperatorOptions)"
                        :size="104"
                        placeholder="运算符"
                        @change="changeConditionValue(rule, selectedWorkflow)"
                      />
                    </div>
                    <div class="condition-value-cell">
                      <m-select
                        v-if="conditionValueOptions(rule.field, selectedWorkflow).length > 0"
                        v-model="rule.value"
                        :options="toSelectOptions(conditionValueOptions(rule.field, selectedWorkflow))"
                        :size="248"
                        placeholder="值"
                        multiple
                        has-confirm
                        has-check-all
                        mode="multiple"
                        @change="changeConditionValue(rule, selectedWorkflow)"
                      />
                      <m-input v-else v-model="rule.value" :width="248" placeholder="请输入值" @update:model-value="changeConditionValue(rule, selectedWorkflow)" />
                    </div>
                    <div class="condition-actions">
                      <m-button type="link" size="small" @click="addConditionRuleAfter(index, selectedWorkflow)">添加</m-button>
                      <m-button type="link" size="small" @click="removeConditionRule(index, selectedWorkflow)">删除</m-button>
                    </div>
                  </div>
                </div>
              </m-form-item>
            </m-form>
          </section>

          <section v-if="activeWorkflowConfigTab === 'status'" class="property-card">
            <div class="status-rule-block">
              <div class="status-rule-block-head">
                <strong>流程状态字典</strong>
                <m-button type="link" size="small" @click="addWorkflowStatus">新增状态</m-button>
              </div>
              <div class="workflow-status-list">
                <article
                  v-for="status in selectedWorkflow.statusDefinitions"
                  :key="status.id"
                  class="workflow-status-row"
	                >
                  <m-input v-model="status.statusName" :width="'100%'" placeholder="状态名称" @update:model-value="changeWorkflowStatusDefinition" />
                  <m-input v-model="status.statusCode" :width="'100%'" placeholder="状态编码" @update:model-value="changeWorkflowStatusDefinition" />
                  <m-button type="link" size="small" @click="removeWorkflowStatus(status)">删除</m-button>
                </article>
              </div>
            </div>

            <div class="status-rule-block">
              <div class="status-rule-block-head">
                <strong>状态流转规则</strong>
              </div>
              <div class="status-transition-list">
                <article
                  v-for="{ status, rule } in statusRuleGroups"
                  :key="rule.id"
                  class="status-transition-card"
	                >
	                  <header class="status-transition-head">
	                    <div class="status-transition-title-row">
	                      <div class="status-rule-title">
	                        <span>流程状态</span>
	                        <strong>{{ status.statusName }}</strong>
	                        <code>{{ status.statusCode }}</code>
	                      </div>
	                    </div>
	                  </header>
	                  <div class="status-condition-list">
                    <div
                      v-for="(condition, conditionIndex) in rule.conditions"
	                      :key="condition.id"
	                      class="status-condition-row"
	                    >
	                      <span class="status-condition-relation">{{ conditionIndex === 0 ? '当' : relationLabel(rule.logicMode === 'any' ? 'OR' : 'AND') }}</span>
	                      <m-select
	                        v-model="condition.nodeCode"
	                        :options="toSelectOptions(statusRuleNodeOptions)"
	                        style="width: 100%;"
	                        placeholder="选择节点"
                        @change="changeStatusRuleConditionNode(condition)"
                      />
                      <m-select
	                        v-model="condition.outputResult"
	                        :options="toSelectOptions(outputOptionsForNodeCode(condition.nodeCode))"
	                        style="width: 100%;"
	                        placeholder="路由状态"
	                        @change="markStrategyDirty"
	                      />
                      <m-button type="link" size="small" @click="removeStatusRuleCondition(rule, conditionIndex)">删除条件</m-button>
                    </div>
                  </div>
                  <footer class="status-transition-footer">
                    <span>{{ statusTransitionRuleText(rule, status) }}</span>
                    <m-button type="link" size="small" @click="addStatusRuleCondition(rule)">添加条件</m-button>
                  </footer>
                </article>
                <p v-if="statusRuleGroups.length === 0" class="empty-hint">请先维护流程状态字典。</p>
              </div>
            </div>
          </section>

          <section v-if="activeWorkflowConfigTab === 'nodes'" class="property-card">
            <header class="property-card-head">
              <h3>节点配置</h3>
            </header>

            <div class="node-config-section">
              <header class="node-config-section-head">
                <strong>工作阶段节点</strong>
                <m-button type="link" size="small" @click="addNode">添加工作阶段</m-button>
              </header>
              <div class="stage-list">
                <article
                  v-for="stage in selectedWorkflow.stageStrategies"
                  :key="stage.stageCode"
                  class="stage-card"
                  :class="{ 'stage-card--custom': isCustomStageStrategy(stage) }"
                >
                  <template v-if="isCustomStageStrategy(stage)">
                    <div class="approval-config-fields stage-config-fields">
                      <label class="config-field">
                        <span>节点名称</span>
                        <m-input
                          v-model="stage.stageName"
                          :width="'100%'"
                          placeholder="请输入节点名称"
                          @update:model-value="changeCustomStageName(stage)"
                        />
                      </label>
                      <label class="config-field">
                        <span>节点选择</span>
                        <m-select
                          v-model="stage.targetStageCode"
                          :options="toSelectOptions(stageInsertTargetOptions(stage))"
                          style="width: 100%;"
                          placeholder="请选择流程节点"
                          @change="changeCustomStageInsertRule(stage)"
                        />
                      </label>
                      <label class="config-field">
                        <span>插入位置</span>
                        <m-select
                          v-model="stage.position"
                          :options="toSelectOptions(approvalPositionOptions)"
                          style="width: 100%;"
                          placeholder="请选择节点前或节点后"
                          @change="changeCustomStageInsertRule(stage)"
                        />
                      </label>
                    </div>
                    <div class="strategy-row node-card-action-row">
                      <span>节点启用</span>
                      <div class="node-config-actions">
                        <m-switch v-model="stage.enabledSwitch" @change="changeStageEnabled(stage)" />
                        <m-button type="link" size="small" :disabled="stage.enabledSwitch !== 'checked'" @click="openStageNodeDetail(stage)">详情</m-button>
                        <m-button v-if="isCustomStageStrategy(stage)" type="link" size="small" @click="removeStageNode(stage)">删除</m-button>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <header class="stage-card-head">
                      <div>
                        <strong>{{ stage.stageName }}</strong>
                      </div>
                    </header>

                    <div class="strategy-row">
                      <span>节点启用</span>
                      <div class="node-config-actions">
                        <m-switch v-model="stage.enabledSwitch" @change="changeStageEnabled(stage)" />
                        <m-button type="link" size="small" :disabled="stage.enabledSwitch !== 'checked'" @click="openStageNodeDetail(stage)">详情</m-button>
                      <m-button v-if="isCustomStageStrategy(stage)" type="link" size="small" @click="removeStageNode(stage)">删除</m-button>
                    </div>
                  </div>
                </template>
                </article>
              </div>
            </div>

            <div class="node-config-section">
              <header class="node-config-section-head">
                <strong>审批节点</strong>
                <m-button type="link" size="small" @click="addApprovalConfig">添加审批节点</m-button>
              </header>
              <div class="config-list">
                <article v-for="config in selectedWorkflow.approvalConfigs" :key="config.id" class="config-card">
                  <div class="approval-config-fields">
                    <label class="config-field">
                      <span>审批节点名称</span>
                      <m-input
                        v-model="config.approvalNodeName"
                        :width="'100%'"
                        placeholder="请输入审批节点名称"
                        @update:model-value="changeApprovalConfig(config)"
                      />
                    </label>
                    <label class="config-field">
                      <span>节点选择</span>
                      <m-select v-model="config.targetStageCode" :options="toSelectOptions(approvalTargetOptionsForConfig(config))" style="width: 100%;" placeholder="请选择流程节点" @change="changeApprovalConfig(config)" />
                    </label>
                    <label class="config-field">
                      <span>插入位置</span>
                      <m-select v-model="config.position" :options="toSelectOptions(approvalPositionOptions)" style="width: 100%;" placeholder="请选择节点前或节点后" @change="changeApprovalConfig(config)" />
                    </label>
                  </div>
                  <div class="strategy-row node-card-action-row">
                    <span>节点启用</span>
                    <div class="node-config-actions">
                      <m-switch v-model="config.enabledSwitch" @change="changeApprovalConfig(config)" />
                      <m-button type="link" size="small" :disabled="config.enabledSwitch !== 'checked'" @click="openApprovalNodeDetail(config)">详情</m-button>
                      <m-button type="link" size="small" @click="removeApprovalConfig(config.id)">删除</m-button>
                    </div>
                  </div>
                </article>
                <p v-if="selectedWorkflow.approvalConfigs.length === 0" class="empty-hint">暂未加入审批节点。</p>
              </div>
            </div>

            <div v-if="selectedWorkflow.systemNodeConfigs.length > 0" class="node-config-section">
              <header class="node-config-section-head">
                <strong>系统节点</strong>
              </header>
              <div class="config-list">
                <article v-for="config in selectedWorkflow.systemNodeConfigs" :key="config.id" class="config-card">
                  <div class="strategy-row">
                    <div class="system-node-title">
                      <strong>{{ config.nodeName || systemActionLabel(config.systemActionTemplate) }}</strong>
                    </div>
                    <div class="node-config-actions">
                      <m-switch v-model="config.enabledSwitch" @change="changeSystemNodeConfig(config)" />
                      <m-button type="link" size="small" :disabled="config.enabledSwitch !== 'checked'" @click="openSystemNodeDetail(config)">详情</m-button>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section class="property-card property-actions">
            <m-button type="default" @click="openValidationModal">校验</m-button>
            <m-button type="primary" :loading="savingStrategy" @click="saveGlobalStrategy">保存业务配置</m-button>
          </section>
        </div>
      </aside>

      <section v-if="nodeDetailVisible" class="node-detail-panel">
        <header class="node-detail-head">
          <div>
            <span class="panel-kicker">节点详情侧弹窗</span>
            <h2>{{ nodeDetailForm.nodeName }}</h2>
          </div>
          <m-button type="link" @click="closeNodeDetail">关闭</m-button>
        </header>

        <div v-if="nodeDetailForm.nodeType === 'systemTask'" class="node-readonly-banner">
          系统动作模板由产品或实施预置，可配置节点输出结果用于路由和单据状态规则。
        </div>

        <m-tabs v-model="activeNodeDetailTab" :data="nodeDetailTabs" class="node-detail-tabs" />

        <div class="node-detail-scroll">
          <template v-if="activeNodeDetailTab === 'basic'">
            <section class="property-card">
              <h3>基础信息</h3>
              <m-form :model="nodeDetailForm" label-position="left" label-width="96px">
                <m-form-item label="节点名称" required>
                  <m-input v-model="nodeDetailForm.nodeName" :width="240" placeholder="请输入节点名称" />
                </m-form-item>
                <m-form-item label="节点类型">
                  <m-input :model-value="nodeTypeLabel(nodeDetailForm.nodeType)" :width="240" disabled />
                </m-form-item>
                <m-form-item v-if="nodeDetailForm.nodeType === 'approvalFlow'" label="审批流程">
                  <m-select v-model="nodeDetailForm.approvalFlow" :options="toSelectOptions(approvalFlowOptions)" style="width: 240px;" placeholder="请选择审批流程" />
                </m-form-item>
              </m-form>
            </section>

            <section class="property-card">
              <header class="property-card-head">
                <h3>进入条件</h3>
                <m-button type="link" size="small" @click="addEntryRule">添加进入条件</m-button>
              </header>
              <div v-if="nodeDetailForm.entryRules.length > 1" class="entry-logic-row">
                <span>满足方式</span>
                <m-select
                  v-model="nodeDetailForm.entryLogicMode"
                  :options="toSelectOptions(entryLogicOptions)"
                  style="width: 176px;"
                  placeholder="请选择满足方式"
                />
              </div>
              <div v-if="nodeDetailForm.entryRules.length > 0" class="route-rule-list">
                <article v-for="(rule, ruleIndex) in nodeDetailForm.entryRules" :key="rule.id" class="route-rule-item">
                  <m-button class="route-rule-delete" type="link" size="small" @click="removeEntryRule(ruleIndex)">删除条件</m-button>
                  <p class="route-rule-sentence">
                    <span class="entry-relation-chip">{{ entryRelationLabel(ruleIndex) }}</span>
                    {{ entryRuleExpression(rule, nodeDetailForm) }}
                  </p>
                  <div v-if="rule.editable" class="route-condition-editor">
                    <div class="route-rule-controls">
                      <label class="route-rule-control">
                        <span>来源节点</span>
                        <m-select
                          v-model="rule.sourceNodeCode"
                          :options="toSelectOptions(entrySourceNodeOptions)"
                          :size="'100%'"
                          style="width: 100%;"
                          placeholder="请选择来源节点"
                          @change="changeEntryRuleSource(rule)"
                        />
                      </label>
                      <label class="route-rule-control route-rule-control--status">
                        <span>输出结果</span>
                        <m-select
                          v-model="rule.sourceStatus"
                          :options="toSelectOptions(entryOutputStatusOptions(rule))"
                          :size="'100%'"
                          style="width: 100%;"
                          placeholder="请选择输出结果"
                        />
                      </label>
                      <m-button type="link" size="small" @click="addEntryCondition(ruleIndex)">添加业务条件</m-button>
                    </div>
                    <div v-if="rule.conditions.length === 0" class="route-condition-empty">
                      <span>未配置额外条件。</span>
                    </div>
                    <div v-for="(condition, conditionIndex) in rule.conditions" :key="condition.id" class="route-condition-row">
                      <div class="route-condition-relation">
                        <m-select
                          v-if="conditionIndex > 0"
                          v-model="condition.relation"
                          :options="toSelectOptions(relationOptions)"
                          :size="64"
                          placeholder="关系"
                        />
                        <span v-else>且</span>
                      </div>
                      <m-select
                        v-model="condition.field"
                        :options="toSelectOptions(routeConditionFieldOptions)"
                        :size="132"
                        placeholder="条件主体"
                        @change="changeRouteConditionField(condition)"
                      />
                      <m-select
                        v-model="condition.operator"
                        :options="toSelectOptions(conditionOperatorOptions)"
                        :size="96"
                        placeholder="运算符"
                      />
                      <m-select
                        v-if="conditionValueOptions(condition.field, selectedWorkflow).length > 0"
                        v-model="condition.value"
                        :options="toSelectOptions(conditionValueOptions(condition.field, selectedWorkflow))"
                        :size="148"
                        placeholder="值"
                        multiple
                        has-confirm
                        has-check-all
                        mode="multiple"
                      />
                      <m-input v-else v-model="condition.value" :width="148" placeholder="请输入值" />
                      <m-button type="link" size="small" @click="removeEntryCondition(ruleIndex, conditionIndex)">删除</m-button>
                    </div>
                  </div>
                  <div v-else class="route-generated-hint">{{ rule.generatedHint || '由条件路由自动生成，随上游规则同步更新。' }}</div>
                </article>
              </div>
              <p v-else class="empty-hint">当前节点暂无进入条件，请添加来源节点与输出结果。</p>
            </section>

            <section class="property-card">
              <header class="property-card-head">
                <h3>输出影响范围</h3>
              </header>
              <div v-if="outputRouteImpacts.length > 0" class="route-impact-list">
                <article v-for="impact in outputRouteImpacts" :key="impact.id" class="route-impact-item">
                  <strong>{{ impact.statusLabel }}</strong>
                  <span>进入「{{ impact.targetName }}」{{ impact.conditionText ? `，且 ${impact.conditionText}` : '' }}</span>
                </article>
              </div>
              <p v-else class="empty-hint">当前节点暂无输出影响。</p>
            </section>
          </template>

          <template v-else-if="activeNodeDetailTab === 'execution'">
            <section v-if="isExecutorConfigVisible(nodeDetailForm)" class="property-card">
              <h3>执行人调度</h3>
              <div class="executor-rule-list">
                <div v-if="canConfigureNodeAssignment(nodeDetailForm)" class="execution-requirement-row">
                  <div class="execution-requirement-main">
                    <div>
                      <strong>排程派工</strong>
                      <span>开启后将在该工作阶段前生成 AI 或人工排程节点。</span>
                    </div>
                    <m-switch v-model="nodeDetailForm.assignmentEnabledSwitch" @change="changeNodeAssignmentEnabled" />
                  </div>
                  <div v-if="nodeDetailForm.assignmentEnabledSwitch === 'checked'" class="assignment-subform">
                    <div class="config-field config-field--inline">
                      <span>派工方式</span>
                      <div class="assignment-mode-options">
                        <button
                          type="button"
                          class="assignment-mode-option"
                          :class="{ 'assignment-mode-option--active': nodeDetailForm.assignmentMode === 'system' }"
                          @click="selectNodeAssignmentMode('system')"
                        >
                          AI排程派工
                        </button>
                        <button
                          type="button"
                          class="assignment-mode-option"
                          :class="{ 'assignment-mode-option--active': nodeDetailForm.assignmentMode === 'manual' }"
                          @click="selectNodeAssignmentMode('manual')"
                        >
                          人工排程派工
                        </button>
                      </div>
                    </div>
                    <div class="config-field config-field--inline">
                      <span>执行人来源</span>
                      <m-select
                        v-model="nodeDetailForm.executorSource"
                        :options="toSelectOptions(executorSourceOptionsForNode(nodeDetailForm))"
                        style="width: 100%;"
                        disabled
                        placeholder="继承排程派工结果"
                      />
                    </div>
                  </div>
                  <div v-else-if="canConfigureExecutorSource(nodeDetailForm)" class="assignment-subform">
                    <div class="config-field config-field--inline">
                      <span>执行人来源</span>
                      <m-select
                        v-model="nodeDetailForm.executorSource"
                        :options="toSelectOptions(executorSourceOptionsForNode(nodeDetailForm))"
                        style="width: 100%;"
                        placeholder="请选择执行人来源"
                        @change="changeExecutorSource"
                      />
                    </div>
                    <div v-if="nodeDetailForm.executorSource === 'specifiedNodeExecutor'" class="config-field config-field--inline">
                      <span>来源节点</span>
                      <m-select
                        v-model="nodeDetailForm.executorSourceNodeCode"
                        :options="toSelectOptions(executorSourceNodeOptions)"
                        style="width: 100%;"
                        placeholder="请选择节点"
                      />
                    </div>
                    <div v-if="nodeDetailForm.executorSource === 'fixedRole'" class="config-field config-field--inline">
                      <span>岗位</span>
                      <m-select
                        v-model="nodeDetailForm.fallbackExecutor"
                        :options="toSelectOptions(assignmentRoleOptions)"
                        style="width: 100%;"
                        placeholder="请选择岗位"
                      />
                    </div>
                    <div v-if="nodeDetailForm.executorSource === 'manualSelect'" class="config-field config-field--inline">
                      <span>人员</span>
                      <m-select
                        v-model="nodeDetailForm.executorPerson"
                        :options="toSelectOptions(assignmentPersonOptions)"
                        style="width: 100%;"
                        placeholder="请选择人员"
                      />
                    </div>
                  </div>
                </div>
                <div v-else-if="canConfigureExecutorSource(nodeDetailForm)" class="execution-requirement-row">
                  <div class="execution-requirement-main">
                    <div>
                      <strong>执行人来源</strong>
                      <span>配置谁负责完成当前分配流转节点。</span>
                    </div>
                  </div>
                  <div class="assignment-subform">
                    <div class="config-field config-field--inline">
                      <span>执行人来源</span>
                      <m-select
                        v-model="nodeDetailForm.executorSource"
                        :options="toSelectOptions(executorSourceOptionsForNode(nodeDetailForm))"
                        style="width: 100%;"
                        placeholder="请选择执行人来源"
                        @change="changeExecutorSource"
                      />
                    </div>
                    <div v-if="nodeDetailForm.executorSource === 'fixedRole'" class="config-field config-field--inline">
                      <span>岗位</span>
                      <m-select
                        v-model="nodeDetailForm.fallbackExecutor"
                        :options="toSelectOptions(assignmentRoleOptions)"
                        style="width: 100%;"
                        placeholder="请选择岗位"
                      />
                    </div>
                    <div v-if="nodeDetailForm.executorSource === 'manualSelect'" class="config-field config-field--inline">
                      <span>人员</span>
                      <m-select
                        v-model="nodeDetailForm.executorPerson"
                        :options="toSelectOptions(assignmentPersonOptions)"
                        style="width: 100%;"
                        placeholder="请选择人员"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="isExecutionCapabilityVisible(nodeDetailForm)" class="property-card">
              <h3>执行人可进行操作配置</h3>
              <div class="execution-requirement-list">
                <div v-for="policy in workStageExecutionRequirementOptions" :key="policy.value" class="execution-requirement-row">
                  <div class="execution-requirement-main">
                    <div>
                      <strong>{{ policy.label }}</strong>
                      <span>{{ executionRequirementDescription(policy.value) }}</span>
                    </div>
                    <m-switch v-model="nodeDetailForm.actionPolicies[policy.value]" @change="changeActionPolicySwitch(policy.value)" />
                  </div>
                  <div v-if="requiresActionPolicyApproval(policy.value) && nodeDetailForm.actionPolicies[policy.value] === 'checked'" class="execution-approval-field">
                    <span>审批流程</span>
                    <m-select
                      v-model="nodeDetailForm.actionPolicyApprovalFlows[policy.value]"
                      :options="toSelectOptions(approvalFlowOptions)"
                      style="width: 100%;"
                      placeholder="请选择审批流程"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section v-if="isExecutionResultConfigVisible(nodeDetailForm)" class="property-card">
              <header class="property-card-head">
                <h3>执行结果配置</h3>
                <m-button v-if="canAddExecutionResultOption(nodeDetailForm)" type="link" size="small" @click="addExecutionResultOption">新增其他结果</m-button>
              </header>
              <div class="execution-result-list">
                <article
                  v-for="(option, index) in nodeDetailForm.statusOutputOptions"
                  :key="`${option.value}-${index}`"
                  class="execution-result-row"
                >
                  <label class="config-field">
                    <span>结果名称</span>
                    <m-input
                      v-model="option.label"
                      :width="'100%'"
                      :disabled="isPresetExecutionResultOption(option)"
                      placeholder="请输入结果名称"
                    />
                  </label>
                  <label class="config-field">
                    <span>结果编码</span>
                    <m-input
                      v-model="option.value"
                      :width="'100%'"
                      :disabled="isPresetExecutionResultOption(option)"
                      placeholder="请输入结果编码"
                      @update:model-value="changeExecutionResultCode(option)"
                    />
                  </label>
                  <m-button
                    v-if="!isPresetExecutionResultOption(option)"
                    type="link"
                    size="small"
                    @click="removeExecutionResultOption(index)"
                  >
                    删除
                  </m-button>
                </article>
              </div>
            </section>
            <p v-if="!isExecutorConfigVisible(nodeDetailForm) && !isExecutionCapabilityVisible(nodeDetailForm) && !isExecutionResultConfigVisible(nodeDetailForm)" class="empty-hint">当前节点不需要配置人工执行规则。</p>
          </template>

          <template v-else-if="activeNodeDetailTab === 'permissions'">
            <section v-if="isDataPermissionConfigVisible(nodeDetailForm)" class="property-card">
              <h3>数据权限</h3>
              <div class="data-permission-board">
                <article
                  v-for="section in dataPermissionSections"
                  :key="section.value"
                  class="data-permission-section"
                  :class="`data-permission-section--${section.value}`"
                >
                  <header class="data-permission-section-head">
                    <div>
                      <strong>{{ section.label }}</strong>
                      <span>{{ section.description }}</span>
                    </div>
                    <code>{{ dataPermissionGroupsByMode(section.value).length }}</code>
                  </header>
                  <div v-if="dataPermissionGroupsByMode(section.value).length > 0" class="data-permission-items">
                    <div
                      v-for="group in dataPermissionGroupsByMode(section.value)"
                      :key="group.value"
                      class="data-permission-item"
                    >
                      <div class="data-permission-copy">
                        <strong>{{ group.label }}</strong>
                        <span>{{ group.description }}</span>
                      </div>
                      <div class="data-permission-actions">
                        <button
                          v-for="option in dataPermissionMoveOptions(group, section.value)"
                          :key="option.value"
                          type="button"
                          class="data-permission-action"
                          @click="selectNodeDataPermission(group.value, option.value)"
                        >
                          设为{{ option.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p v-else class="data-permission-empty">暂无{{ section.label }}信息</p>
                </article>
              </div>
            </section>
            <section v-if="isCustomDataItemConfigVisible(nodeDetailForm)" class="property-card">
              <header class="property-card-head">
                <h3>自定义数据项</h3>
                <m-button type="link" size="small" @click="addCustomDataItem">新增自定义数据项</m-button>
              </header>
              <div v-if="nodeDetailForm.customDataItems.length > 0" class="custom-data-item-list">
                <article v-for="(item, index) in nodeDetailForm.customDataItems" :key="item.id" class="custom-data-item-row">
                  <label class="config-field">
                    <span>输入项名称</span>
                    <m-input v-model="item.itemName" :width="'100%'" placeholder="请输入输入项名称" />
                  </label>
                  <label class="config-field">
                    <span>数据结构</span>
                    <m-select
                      v-model="item.itemType"
                      :options="toSelectOptions(customDataItemTypeOptions)"
                      style="width: 100%;"
                      placeholder="请选择数据结构"
                    />
                  </label>
                  <m-button type="link" size="small" @click="removeCustomDataItem(index)">删除</m-button>
                </article>
              </div>
              <p v-else class="empty-hint">可为该自定义工作阶段新增现场记录、说明、照片或视频类输入项。</p>
            </section>
            <p v-if="!isDataPermissionConfigVisible(nodeDetailForm) && !isCustomDataItemConfigVisible(nodeDetailForm)" class="empty-hint">当前节点不配置执行页数据权限。</p>
          </template>
        </div>

        <footer class="node-detail-actions">
          <m-button type="default" @click="closeNodeDetail">取消</m-button>
          <m-button type="primary" @click="saveNodeDetail">保存节点详情</m-button>
        </footer>
      </section>
    </section>

    <m-modal v-model:visible="createWorkflowVisible" title="新建工作流程" :width="920" :max-width="920">
      <template #content>
        <div class="create-flow-form">
          <m-form :model="createWorkflowForm" label-position="left" label-width="96px">
            <m-form-item label="流程名称" required>
              <m-input v-model="createWorkflowForm.workflowName" :width="240" placeholder="请输入流程名称" />
            </m-form-item>
            <m-form-item label="工作类型" required>
              <m-select
                v-model="createWorkflowForm.workTypeCode"
                :options="toSelectOptions(workTypeOptions)"
                style="width: 240px;"
                placeholder="请选择工作类型"
                @change="changeCreateWorkflowWorkType"
              />
            </m-form-item>
            <m-form-item label="适用条件">
              <div class="condition-builder create-condition-builder">
                <div v-if="createWorkflowForm.conditionRules.length === 0" class="condition-empty-state">
                  <span>不配置适用条件时，该流程作为默认流程。</span>
                  <m-button type="link" size="small" @click="addConditionRuleAfter(-1, createWorkflowForm, false)">添加条件</m-button>
                </div>
                <div v-for="(rule, index) in createWorkflowForm.conditionRules" :key="rule.id" class="create-condition-rule">
                  <m-select
                    v-if="index > 0"
                    v-model="rule.relation"
                    :options="toSelectOptions(relationOptions)"
                    class="condition-relation-select"
                    style="width: 64px;"
                    placeholder="关系"
                    @change="changeConditionValue(rule, createWorkflowForm, false)"
                  />
                  <span v-else class="condition-relation-placeholder">当</span>
                  <m-select
                    v-model="rule.field"
                    :options="toSelectOptions(conditionFieldOptionsFor(createWorkflowForm))"
                    class="condition-field-select"
                    style="width: 148px;"
                    placeholder="条件主体"
                    @change="changeConditionField(rule, createWorkflowForm, false)"
                  />
                  <m-select
                    v-model="rule.operator"
                    :options="toSelectOptions(conditionOperatorOptions)"
                    class="condition-operator-select"
                    style="width: 96px;"
                    placeholder="运算符"
                    @change="changeConditionValue(rule, createWorkflowForm, false)"
                  />
                  <m-select
                    v-if="conditionValueOptions(rule.field, createWorkflowForm).length > 0"
                    v-model="rule.value"
                    :options="toSelectOptions(conditionValueOptions(rule.field, createWorkflowForm))"
                    class="condition-value-select"
                    style="width: 100%;"
                    placeholder="条件值"
                    multiple
                    has-confirm
                    has-check-all
                    mode="multiple"
                    @change="changeConditionValue(rule, createWorkflowForm, false)"
                  />
                  <m-input v-else v-model="rule.value" class="condition-value-input" :width="'100%'" placeholder="请输入条件值" @update:model-value="changeConditionValue(rule, createWorkflowForm, false)" />
                  <div class="create-condition-actions">
                    <m-button type="link" size="small" @click="addConditionRuleAfter(index, createWorkflowForm, false)">添加条件</m-button>
                    <m-button type="link" size="small" @click="removeConditionRule(index, createWorkflowForm, false)">删除</m-button>
                  </div>
                </div>
              </div>
            </m-form-item>
          </m-form>
        </div>
      </template>
      <template #footer>
        <m-button type="default" @click="createWorkflowVisible = false">取消</m-button>
        <m-button type="primary" @click="confirmCreateWorkflow">创建流程</m-button>
      </template>
    </m-modal>

    <m-modal v-model:visible="deleteWorkflowVisible" title="删除工作流程" :width="420" :max-width="420">
      <template #content>
        <div class="delete-flow-confirm">
          <strong>{{ workflowPendingDelete?.workflowName }}</strong>
          <p>删除后该流程会从当前配置列表移除，流程图与右侧配置将切换到相邻流程。</p>
        </div>
      </template>
      <template #footer>
        <m-button type="default" @click="cancelDeleteWorkflow">取消</m-button>
        <m-button type="primary" @click="confirmDeleteWorkflow">确认删除</m-button>
      </template>
    </m-modal>

    <m-modal v-model:visible="validationVisible" :title="validationModalTitle" :width="760" :max-width="760">
      <template #content>
        <div class="validation-modal">
          <section class="validation-summary-card" :class="{ 'validation-summary-card--pass': validationIssues.length === 0 }">
            <div>
              <strong>{{ validationIssues.length === 0 ? '流程校验通过' : `发现 ${validationIssues.length} 项需要处理` }}</strong>
              <span>{{ selectedWorkflow.workflowName }} · {{ validationCheckedAt }}</span>
            </div>
            <m-tag :type="validationIssues.length === 0 ? 'completed' : 'rejected'">
              {{ validationIssues.length === 0 ? '通过' : '未通过' }}
            </m-tag>
          </section>

          <div v-if="validationIssues.length === 0" class="validation-pass-state">
            当前流程的基础信息、节点连通性、路由、执行人、审批节点和系统节点均未发现阻断项。
          </div>

          <div v-else class="validation-issue-list">
            <article
              v-for="issue in validationIssues"
              :key="issue.id"
              class="validation-issue-card"
              :class="`validation-issue-card--${issue.severity}`"
            >
              <header class="validation-issue-head">
                <div>
                  <strong>{{ issue.title }}</strong>
                  <span>{{ issue.location }}</span>
                </div>
                <m-tag :type="validationIssueTagType(issue)">{{ validationIssueSeverityLabel(issue) }}</m-tag>
              </header>
              <p>{{ issue.description }}</p>
              <footer>
                <m-button type="link" size="small" @click="locateValidationIssue(issue)">前往修改</m-button>
              </footer>
            </article>
          </div>
        </div>
      </template>
      <template #footer>
        <m-button type="default" @click="validationVisible = false">关闭</m-button>
        <m-button v-if="validationIssues.length > 0" type="primary" @click="locateValidationIssue(validationIssues[0])">处理第一项</m-button>
      </template>
    </m-modal>

    <transition name="workflow-toast-fade">
      <div v-if="toastVisible" class="workflow-toast">{{ toastMessage }}</div>
    </transition>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { fetchSharedConfig, saveSharedConfig } from '../utils/sharedConfigApi'
import {
  loadSharedWorkClassifications,
  workClassificationOptions,
  workTypeOptions
} from '../utils/workClassifications'

const classificationOptions = reactive(workClassificationOptions())

function refreshClassificationOptions() {
  const nextOptions = workClassificationOptions()
  classificationOptions.splice(0, classificationOptions.length, ...nextOptions)
}

async function refreshSharedClassificationOptions() {
  const result = await loadSharedWorkClassifications()
  classificationOptions.splice(0, classificationOptions.length, ...workClassificationOptions(result.data))
}

if (typeof window !== 'undefined') {
  window.addEventListener('focus', refreshSharedClassificationOptions)
  window.addEventListener('storage', refreshClassificationOptions)
}

const businessObjectTypeOptions = [
  { value: 'requirementOrder', label: '需求单' },
  { value: 'workOrder', label: '工单' },
  { value: 'approvalOrder', label: '审批单' },
  { value: 'assetChangeOrder', label: '资产变更单' }
]

const nodeTypeOptions = [
  { value: 'start', label: '开始节点' },
  { value: 'end', label: '结束节点' },
  { value: 'systemTask', label: '系统任务节点' },
  { value: 'dispatchFlow', label: '分配流转节点' },
  { value: 'workStage', label: '工作阶段' },
  { value: 'businessFlow', label: '嵌套业务流程节点' },
  { value: 'approvalFlow', label: '审批流转节点' },
  { value: 'gateway', label: '网关节点' }
]

const executionModeOptions = [
  { value: 'singleExecutor', label: '单执行人' },
  { value: 'candidateAnyOne', label: '候选人任一领取' },
  { value: 'multiExecutorAnyOne', label: '多人任一完成' },
  { value: 'multiExecutorAll', label: '多人全部完成' }
]

const pagePolicyOptions = [
  { value: 'requestPage', label: '需求提交页' },
  { value: 'acceptPage', label: '受理分类页' },
  { value: 'dispatchPage', label: '分配调度页' },
  { value: 'inspectionExecutionPage', label: '巡检执行页' },
  { value: 'maintenanceExecutionPage', label: '维保执行页' },
  { value: 'repairDiagnosisPage', label: '维修诊断页' },
  { value: 'repairExecutionPage', label: '维修执行页' },
  { value: 'planPage', label: '方案制定页' },
  { value: 'approvalPage', label: '审批处理页' },
  { value: 'materialPage', label: '物料资源申请页' },
  { value: 'externalPage', label: '外委协同页' },
  { value: 'acceptancePage', label: '验收复核页' },
  { value: 'callbackPage', label: '回访确认页' },
  { value: 'archivePage', label: '归档关闭页' },
  { value: 'assetPage', label: '资产管理页' }
]

const dispatchMethodOptions = [
  { value: 'manualDispatch', label: '人工调度' },
  { value: 'teamCandidate', label: '班组候选' },
  { value: 'fixedRole', label: '固定角色' },
  { value: 'objectOwner', label: '按对象责任人' },
  { value: 'upstreamResult', label: '按上游节点结果' }
]

const approvalFlowOptions = [
  { value: 'approval-inspection-review', label: '巡检审批流' },
  { value: 'approval-maintenance-cost', label: '维保费用审批流' },
  { value: 'approval-repair-risk', label: '维修风险审批流' },
  { value: 'approval-engineering-budget', label: '工程预算审批流' },
  { value: 'approval-service-upgrade', label: '报事升级审批流' }
]

const rejectPolicyOptions = [
  { value: 'returnPreviousStage', label: '退回上一阶段' },
  { value: 'returnSubmitter', label: '退回发起人' },
  { value: 'terminateWorkflow', label: '终止流程' },
  { value: 'manualHandle', label: '转人工处理' }
]

const systemActionOptions = [
  { value: 'aiScheduleDispatch', label: 'AI排程派工' },
  { value: 'sapBudgetCheck', label: 'SAP预算校验' },
  { value: 'sapPaymentProcess', label: 'SAP付款处理' },
  { value: 'sapCompletionCert', label: 'SAP完工认证' },
  { value: 'sapPaymentClaimCreate', label: 'SAP创建付款申请' },
  { value: 'sapBatchReview', label: 'SAP批量复核' },
  { value: 'sapFinalPayment', label: 'SAP最终付款完成' },
  { value: 'amsPaymentSync', label: 'AMS付款结果同步' },
  { value: 'purchasePrCreate', label: '采购PR创建' },
  { value: 'purchasePoReceipt', label: '采购PO入库' },
  { value: 'inventoryReserve', label: '库存占用' },
  { value: 'engineeringResourcePrepare', label: '资源准备' },
  { value: 'engineeringResourceReady', label: '资源就绪确认' },
  { value: 'engineeringCostSettlement', label: '成本归集/费用结算' },
  { value: 'engineeringLedgerArchive', label: '台账更新/资料归档' },
  { value: 'erpMaterialCheck', label: 'ERP物料可用校验' },
  { value: 'erpCostWriteBack', label: 'ERP费用回写' },
  { value: 'assetStatusSync', label: '资产状态同步' },
  { value: 'supplierNotify', label: '供应商协同通知' },
  { value: 'inspectionExceptionDerive', label: '巡检异常派生工单' },
  { value: 'serviceOrderDerive', label: '报事派生工单' },
  { value: 'archiveWriteBack', label: '归档状态回写' }
]

const actionTimingOptions = [
  { value: 'beforeStage', label: '阶段开始前' },
  { value: 'afterStage', label: '阶段完成后' }
]

const actionFailureOptions = [
  { value: 'block', label: '阻断流程' },
  { value: 'warnContinue', label: '告警后继续' },
  { value: 'manualCompensate', label: '转人工补偿' }
]

const notifyTargetOptions = [
  { value: 'dispatcher', label: '调度负责人' },
  { value: 'stageOwner', label: '阶段负责人' },
  { value: 'systemAdmin', label: '系统管理员' },
  { value: 'supplierManager', label: '供应商管理员' }
]

const slaPolicyOptions = [
  { value: 'sla-normal-24h', label: '普通处理 24 小时' },
  { value: 'sla-emergency-2h', label: '应急抢修 2 小时' },
  { value: 'sla-maintenance-plan', label: '计划维保按窗口期' },
  { value: 'sla-service-callback', label: '报事回访 4 小时' }
]

const executorSourceOptions = [
  { value: 'creator', label: '创建人' },
  { value: 'specifiedNodeExecutor', label: '指定节点执行人' },
  { value: 'fixedRole', label: '指定岗位执行人' },
  { value: 'manualSelect', label: '指定执行人' }
]

const inheritedDispatchExecutorSourceOptions = [
  { value: 'inheritDispatch', label: '继承排程派工结果' }
]

const dispatchNodeExecutorSourceOptions = [
  { value: 'fixedRole', label: '指定岗位执行人' },
  { value: 'manualSelect', label: '指定执行人' }
]

const fallbackExecutorOptions = [
  { value: 'engineeringSupervisor', label: '工程主管' },
  { value: 'operationDispatcher', label: '运营调度' },
  { value: 'maintenanceLeader', label: '维保班组长' },
  { value: 'customerServiceLeader', label: '客服主管' }
]

const actionPolicyOptions = [
  { value: 'requestAddExecutor', label: '申请加人' },
  { value: 'requestReplaceExecutor', label: '申请换人' },
  { value: 'requestMaterial', label: '申请领料' },
  { value: 'requestDelay', label: '申请延期' },
  { value: 'requestTerminate', label: '申请终止' }
]

const workStageExecutionRequirementOptions = actionPolicyOptions

const blankActionPolicies = {
  requestAddExecutor: 'uncheck',
  requestReplaceExecutor: 'uncheck',
  requestMaterial: 'uncheck',
  requestDelay: 'uncheck',
  requestTerminate: 'uncheck'
}

const blankActionPolicyApprovalFlows = {
  requestAddExecutor: '',
  requestReplaceExecutor: '',
  requestDelay: '',
  requestTerminate: ''
}

const commonDataPermissionGroups = [
  { value: 'basicInfo', label: '基础信息', description: '单据编号、分类、地点、发起人、创建时间等主数据。', readonlyOnly: true },
  { value: 'currentProgress', label: '当前进展', description: '当前节点、主状态、处理人、时限和进度摘要。', readonlyOnly: true }
]

const workflowRecordPermissionGroup = { value: 'workflowRecords', label: '流程记录', description: '节点路由、审批、驳回、系统同步和操作审计。', readonlyOnly: true }

const workTypeDataPermissionGroups = {
  inspection: [
    ...commonDataPermissionGroups,
    { value: 'inspectionPlan', label: '巡检计划', description: '计划名称、班次、巡检范围、检查项和计划成本。' },
    { value: 'routeRecords', label: '路线与对象', description: '计划路线、实际路线、空间对象、设备对象和执行对象清单。' },
    { value: 'checkInRecords', label: '打卡记录', description: '空间打卡、设备扫码、拍照打卡和到场时间。' },
    { value: 'inspectionExecutionRecords', label: '执行记录', description: '检查记录、抄录记录、无法执行记录和现场执行结果。' },
    { value: 'problemAndRepairRecords', label: '问题与维修记录', description: '异常问题、自修记录、转维修单和前后照片。' },
    { value: 'costInfo', label: '成本信息', description: '计划成本、实际成本、人力、物料和其他费用。' },
    { value: 'slaEvaluations', label: 'SLA评估', description: '响应、执行、异常升级等时限规则的评估结果。', readonlyOnly: true },
    workflowRecordPermissionGroup
  ],
  maintenance: [
    ...commonDataPermissionGroups,
    { value: 'maintenancePlan', label: '维保计划', description: '维保计划、级别、窗口期、作业要求、维保对象和计划成本。' },
    { value: 'checkInRecords', label: '打卡记录', description: '供应商或班组到场打卡、设备扫码和附件。' },
    { value: 'maintenanceExecutionRecords', label: '执行记录', description: '检查记录、维修记录、抄录记录、无法执行记录和服务报告。' },
    { value: 'maintenanceAcceptance', label: '验收记录', description: '验收结论、验收标准、整改要求、服务报告和签字记录。' },
    { value: 'problemAndRepairRecords', label: '问题与维修记录', description: '维保过程中发现的问题、自修处理、派生维修和照片记录。' },
    { value: 'costInfo', label: '成本信息', description: '维保计划成本、实际成本、耗材、外委费用和ERP同步状态。' },
    { value: 'slaEvaluations', label: 'SLA评估', description: '到场响应、维保完成、复核验收等时限评估。', readonlyOnly: true },
    workflowRecordPermissionGroup
  ],
  repair: [
    ...commonDataPermissionGroups,
    { value: 'faultInfo', label: '故障信息', description: '故障来源、报修人、故障对象、现象、影响范围和风险等级。' },
    { value: 'diagnosisRecords', label: '诊断排查', description: '到场核实、诊断结论、故障部位、处理路径和诊断附件。' },
    { value: 'repairPlan', label: '维修方案', description: '维修方案、资源需求、停机窗口、风险措施和计划成本。' },
    { value: 'repairExecutionRecords', label: '执行记录', description: '维修处理、实际工时、实际物料、工具、外委和恢复验证。' },
    { value: 'repairAcceptance', label: '验收记录', description: '维修验收、恢复确认、返工要求、复验记录和签字记录。' },
    { value: 'costInfo', label: '成本信息', description: '计划成本、实际成本、人力、材料和其他费用。' },
    { value: 'slaEvaluations', label: 'SLA评估', description: '响应、恢复、验收等维修时限评估。', readonlyOnly: true },
    workflowRecordPermissionGroup
  ],
  engineeringChange: [
    ...commonDataPermissionGroups,
    { value: 'changeDemand', label: '改造需求', description: '需求背景、目标范围、影响区域和约束条件。' },
    { value: 'siteSurveyRecords', label: '现场勘察记录', description: '现场照片、勘察结论、风险点和限制条件。' },
    { value: 'changePlan', label: '改造方案', description: '技术方案、施工边界、材料方案、工期计划。' },
    { value: 'executionRecords', label: '执行记录', description: '施工过程、进度反馈、问题记录和现场照片。' },
    { value: 'acceptanceRecords', label: '验收记录', description: '验收结论、整改项、签字确认和验收附件。' },
    { value: 'costRecords', label: '成本', description: '预算、成本估算、费用归集、付款相关金额。' },
    { value: 'archiveRecords', label: '台账与归档', description: '台账更新、资料归档、移交记录和归档完整率。' },
    workflowRecordPermissionGroup
  ]
}

const workOrderDataPermissionGroups = workTypeDataPermissionGroups.engineeringChange

const dataPermissionOptions = [
  { value: 'hidden', label: '隐藏' },
  { value: 'readonly', label: '查看' },
  { value: 'editable', label: '编辑' }
]

const dataPermissionSections = [
  { value: 'editable', label: '编辑', description: '执行页可查看并修改这些信息' },
  { value: 'readonly', label: '查看', description: '执行页仅展示，不允许修改' },
  { value: 'hidden', label: '隐藏', description: '执行页不展示这些信息' }
]

const customDataItemTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'media', label: '图片/视频' }
]

const initialNodeDetail = {
  nodeCode: '',
  nodeName: '',
  nodeType: 'workStage',
  stageTemplate: '',
  pagePolicy: '',
  slaPolicy: '',
  executionMode: 'singleExecutor',
  executorSource: 'inheritDispatch',
  executorSourceNodeCode: '',
  executorPerson: 'u-zhang-wei',
  fallbackExecutor: 'engineeringSupervisor',
  assignmentEnabledSwitch: 'uncheck',
  assignmentMode: 'system',
  assignmentTargetType: 'role',
  assignmentTarget: 'operationDispatcher',
  approvalFlow: 'approval-maintenance-cost',
  rejectPolicy: 'returnPreviousStage',
  systemActionTemplate: 'erpMaterialCheck',
  systemActionFailure: 'manualCompensate',
  notifyTarget: 'systemAdmin',
  actionPolicies: { ...blankActionPolicies },
  actionPolicyApprovalFlows: { ...blankActionPolicyApprovalFlows },
  executionPageDataPermissions: {},
  customDataItems: [],
  allowRejectSwitch: 'uncheck',
  rejectTargetNodeCode: '',
  statusOutputOptions: [],
  entryLogicMode: 'all',
  entryRules: [],
  routeRules: [],
  actionSummary: ''
}

const routeStatusOptions = [
  { value: 'notStarted', label: '待开始' },
  { value: 'inProgress', label: '进行中' },
  { value: 'completed', label: '完成' },
  { value: 'approved', label: '通过' },
  { value: 'rejected', label: '驳回' },
  { value: 'failed', label: '失败' }
]

const workStageExecutionResultOptions = [
  { value: 'notStarted', label: '待开始' },
  { value: 'inProgress', label: '进行中' },
  { value: 'completed', label: '完成' },
  { value: 'rejected', label: '驳回' }
]

const approvalExecutionResultOptions = [
  { value: 'inProgress', label: '进行中' },
  { value: 'approved', label: '通过' },
  { value: 'rejected', label: '驳回' },
  { value: 'failed', label: '失败' }
]

const defaultSystemExecutionResultOptions = [
  { value: 'notStarted', label: '待开始' },
  { value: 'inProgress', label: '进行中' },
  { value: 'completed', label: '完成' },
  { value: 'failed', label: '失败' }
]

const sapPaymentExecutionResultOptions = [
  { value: 'completionCertified', label: '完工认证完成' },
  { value: 'paymentClaimCreated', label: '付款申请已创建' },
  { value: 'batchReviewing', label: '批量复核中' },
  { value: 'completed', label: '最终付款完成' },
  { value: 'failed', label: '失败' }
]

const executionResultPresetValues = new Set([
  ...workStageExecutionResultOptions.map(item => item.value),
  ...approvalExecutionResultOptions.map(item => item.value),
  ...defaultSystemExecutionResultOptions.map(item => item.value),
  ...sapPaymentExecutionResultOptions.map(item => item.value)
])

const conditionFieldOptions = [
  { value: 'classificationCode', label: '工作分类' },
  { value: 'businessCategory', label: '业务分类' },
  { value: 'assetMajor', label: '设备专业' },
  { value: 'riskLevel', label: '风险等级' },
  { value: 'sourceType', label: '来源类型' },
  { value: 'serviceRequestCategory', label: '报事报修分类' },
  { value: 'season', label: '季节场景' },
  { value: 'budgetLevel', label: '预算级别' },
  { value: 'contractMode', label: '外委方式' },
  { value: 'assetStatus', label: '资产状态' },
  { value: 'estimatedRepairAmount', label: '预计维修金额' },
  { value: 'repairImpactScope', label: '维修影响范围' },
  { value: 'pscRequired', label: 'PSC' },
  { value: 'psaRequired', label: 'PSA' },
  { value: 'rejectReason', label: '驳回原因' }
]

const routeConditionFieldOptions = conditionFieldOptions.filter(item => item.value !== 'classificationCode')

const inspectionPlanConditionFieldOption = { value: 'inspectionPlan', label: '巡检计划' }
const inspectionConditionFieldOptions = [
  ...conditionFieldOptions.filter(item => ['classificationCode', 'businessCategory'].includes(item.value)),
  inspectionPlanConditionFieldOption
]

const conditionOperatorOptions = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' }
]

const relationOptions = [
  { value: 'AND', label: '且' },
  { value: 'OR', label: '或' }
]

const entryLogicOptions = [
  { value: 'all', label: '全部满足（且）' },
  { value: 'any', label: '任一满足（或）' }
]

const approvalPositionOptions = [
  { value: 'before', label: '节点前' },
  { value: 'after', label: '节点后' }
]

const assignmentTargetTypeOptions = [
  { value: 'role', label: '岗位' },
  { value: 'person', label: '人员' }
]

const assignmentRoleOptions = [
  { value: 'operationDispatcher', label: '运营调度' },
  { value: 'engineeringSupervisor', label: '工程主管' },
  { value: 'inspectionLeader', label: '巡检班组长' },
  { value: 'maintenanceLeader', label: '维保班组长' },
  { value: 'repairLeader', label: '维修班组长' },
  { value: 'projectManager', label: '工程项目经理' }
]

const assignmentPersonOptions = [
  { value: 'u-zhang-wei', label: '张伟' },
  { value: 'u-li-na', label: '李娜' },
  { value: 'u-wang-lei', label: '王磊' },
  { value: 'u-chen-min', label: '陈敏' },
  { value: 'u-zhao-yu', label: '赵宇' }
]

const conditionValueMap = {
  classificationCode: classificationOptions,
  businessCategory: [
    { value: '暖通', label: '暖通' },
    { value: '给排水', label: '给排水' },
    { value: '强电', label: '强电' },
    { value: '弱电', label: '弱电' },
    { value: '消防', label: '消防' },
    { value: '土建', label: '土建' }
  ],
  inspectionPlan: [
    { value: 'IP-DAY-PUBLIC', label: '公共区日常巡检计划' },
    { value: 'IP-ROOM-POWER', label: '设备房巡检计划' },
    { value: 'IP-SYSTEM-HVAC', label: '暖通系统巡检计划' },
    { value: 'IP-OUT-VENDOR', label: '外委巡检计划' },
    { value: 'IP-FIRE-SAFETY', label: '消防安全巡检计划' },
    { value: 'IP-TEMP-SPECIAL', label: '临时专项巡检计划' }
  ],
  assetMajor: [
    { value: '电梯', label: '电梯' },
    { value: '暖通', label: '暖通' },
    { value: '消防', label: '消防' },
    { value: '高压配电', label: '高压配电' },
    { value: '给排水', label: '给排水' }
  ],
  riskLevel: [
    { value: '高', label: '高' },
    { value: '中', label: '中' },
    { value: '低', label: '低' }
  ],
  sourceType: [
    { value: '计划生成', label: '计划生成' },
    { value: '用户报事', label: '用户报事' },
    { value: '巡检发现', label: '巡检发现' },
    { value: '监控告警', label: '监控告警' }
  ],
  serviceRequestCategory: [
    { value: '工程维修', label: '工程维修' },
    { value: '投诉建议', label: '投诉建议' },
    { value: '非工程报事', label: '非工程报事' },
    { value: '工程服务申请', label: '工程服务申请' }
  ],
  season: [
    { value: '供冷切换', label: '供冷切换' },
    { value: '供暖切换', label: '供暖切换' },
    { value: '汛期前', label: '汛期前' },
    { value: '冬防前', label: '冬防前' }
  ],
  budgetLevel: [
    { value: '小额', label: '小额' },
    { value: '一般', label: '一般' },
    { value: '大额', label: '大额' },
    { value: '专项', label: '专项' }
  ],
  contractMode: [
    { value: '自管', label: '自管' },
    { value: '框架合同', label: '框架合同' },
    { value: '单次采购', label: '单次采购' }
  ],
  assetStatus: [
    { value: '在用', label: '在用' },
    { value: '停用', label: '停用' },
    { value: '报废', label: '报废' }
  ],
  pscRequired: [
    { value: '是', label: '是' },
    { value: '否', label: '否' }
  ],
  psaRequired: [
    { value: '是', label: '是' },
    { value: '否', label: '否' }
  ],
  rejectReason: [
    { value: '方案问题', label: '方案问题' },
    { value: '物料不足', label: '物料不足' },
    { value: '安全风险', label: '安全风险' },
    { value: '现场条件不满足', label: '现场条件不满足' },
    { value: '信息需补充', label: '信息需补充' }
  ]
}

let conditionSeq = 1
let stageSeq = 1
let approvalSeq = 1
let systemNodeSeq = 1
const WORKFLOW_STORAGE_KEY = 'workflow-config-prototype-state-v5-inspection-plan-dispatch'
const SHARED_WORKFLOW_CONFIG_KEY = 'workflows'
const FLOW_NODE_WIDTH = 180
const FLOW_NODE_HEIGHT = 108
const FLOW_NODE_GAP = 68
const FLOW_APPROVAL_GAP = 126
const FLOW_CANVAS_WIDTH = 620
const FLOW_CANVAS_PADDING_Y = 48
const FLOW_NODE_CENTER_X = 310
const ROUTE_SIDE_OFFSET = 100
const ROUTE_CORNER_RADIUS = 20
const ROUTE_LABEL_WIDTH = 176
const ROUTE_BYPASS_LABEL_WIDTH = 168
const ROUTE_REJECT_LABEL_WIDTH = 196
const ROUTE_LABEL_HEIGHT = 28
const ENGINEERING_CHANGE_SKELETON_VERSION = '20260620-ha-capital-cleanup-v3'
const TENANT_AO_REPAIR_VERSION = '20260622-soft-ao-route-repair-v1'
const CAPITAL_DISPATCH_REPAIR_VERSION = '20260622-remove-manual-dispatch-v1'
const legacyEngineeringClassificationMap = {
  'ENG-SMALL': 'ENG-MINOR',
  'ENG-SYSTEM': 'ENG-PROJECT',
  'ENG-COMPLIANCE': 'ENG-PROJECT',
  'ENG-MID': 'ENG-PROJECT',
  'ENG-OUT': 'ENG-TENANT',
  'ENG-PRE': 'ENG-PROJECT',
  'ENG-APPROVAL': 'ENG-PROJECT',
  'ENG-CONSTRUCT': 'ENG-PROJECT',
  'ENG-ACCEPT': 'ENG-PROJECT'
}
const legacyEngineeringWorkflowMap = {
  'WF-ENG-SMALL': {
    workflowCode: 'WF-ENG-MINOR',
    workflowName: '小型工程工单流程',
    classificationCode: 'ENG-MINOR',
    conditionSummary: '工作分类=小型工程且预算级别=小额'
  },
  'WF-ENG-MID': {
    workflowCode: 'WF-ENG-PROJECT',
    workflowName: '项目工程工单流程',
    classificationCode: 'ENG-PROJECT',
    conditionSummary: '工作分类=项目工程且预算金额>=阈值'
  },
  'WF-ENG-OUT': {
    workflowCode: 'WF-ENG-TENANT',
    workflowName: '租户工程工单流程',
    classificationCode: 'ENG-TENANT',
    conditionSummary: '工作分类=租户工程且施工主体=租户'
  }
}

const engineeringStatusNameMap = {
  CRTE: '创建',
  SBMT: '已提交',
  SORJ: 'SO（支持审批人）驳回',
  SOSP: 'SO（支持审批人）支持通过',
  AORJ: 'AO（授权审批人）驳回',
  AOAP: 'AO（授权审批人）批准',
  ISSD: '工单已签发',
  SAPRJ: 'SAP（预算校验）驳回',
  PLAN: '方案制定中',
  TAPR: '技术审批中',
  TERJ: '技术审批驳回',
  PCAP: '进度/成本审批中',
  PCRJ: '进度/成本审批驳回',
  FIAP: '财务审批中',
  FIRJ: '财务审批驳回',
  PRCR: '采购PR已创建',
  POGR: '采购PO入库完成',
  STOC: '库存已占用',
  DISP: '已排程派工',
  EXE: '改造执行中',
  ACPT: '待改造验收',
  ACRJ: '改造验收驳回',
  ACK: '承包商已确认',
  INPR: '承包商执行中',
  RTCP: '承包商完工上报',
  RJCP: '完工上报驳回',
  CERT: '完工认证',
  PMCR: 'SAP（付款申请）已创建',
  BHRV: 'SAP（批量复核）待复核',
  FPCP: 'SAP（最终付款）已完成'
}

const workflows = ref(loadStoredWorkflows())

function createConfiguredFlow(workflowCode, workflowName, classificationCode, version, status, preset, conditionSummary, nodes, routeLabels = [], routes = []) {
  const workflow = createFlow(workflowCode, workflowName, classificationCode, version, status, preset, conditionSummary, nodes, routeLabels)
  rebuildWorkflowByStrategies(workflow)
  if (routes.length > 0) applyWorkflowRoutes(workflow, routes, routeLabels)
  return workflow
}

function applyWorkflowRoutes(workflow, routes, routeLabels = []) {
  const baselineRoutes = normalizeRoutes(workflow.routes || buildGeneratedRoutes(workflow.nodes, routeLabels), workflow.nodes)
  const configuredRoutes = normalizeRoutes(routes, workflow.nodes)
  const configuredRouteKeys = new Set(configuredRoutes.map(routeConditionRuleKey))

  workflow.routes = configuredRoutes
  workflow.routeConditionRules = dedupeRouteConditionRules(
    configuredRoutes
      .filter(route => !isGeneratedRouteEquivalent(route, baselineRoutes))
      .map(route => routeToStoredRouteRule(route, workflow.nodes))
  )
  workflow.disabledRouteRules = dedupeRouteConditionRules(
    baselineRoutes
      .filter(route => !configuredRouteKeys.has(routeConditionRuleKey(route)))
      .map(route => routeToStoredRouteRule(route, workflow.nodes))
  )
}

function workflowRoute(sourceNodeCode, targetNodeCode, conditionSummary, sourceStatus = 'completed', extraConditions = [], routeType = '') {
  return {
    sourceNodeCode,
    targetNodeCode,
    sourceStatus,
    conditionSummary,
    routeType: routeType || (sourceStatus === 'rejected' ? 'reject' : (sourceStatus === 'approved' ? 'approve' : 'default')),
    priority: '',
    extraConditions,
    entryConfigured: true
  }
}

function createEngineeringWorkflow(kind) {
  const config = engineeringWorkflowConfig(kind)
  const workflow = createConfiguredFlow(
    config.workflowCode,
    config.workflowName,
    config.classificationCode,
    config.version,
    'published',
    true,
    config.conditionSummary,
    config.nodes,
    [],
    config.routes
  )
  applyEngineeringStatusConfiguration(workflow, config.statusCodes, config.statusRules)
  return workflow
}

function applyEngineeringStatusConfiguration(workflow, statusCodes, rules) {
  workflow.statusDefinitions = engineeringWorkflowStatuses(statusCodes)
  workflow.statusTransitionRules = normalizeStatusTransitionRules(workflow, rules)
  ensureStatusTransitionRulesForStatuses(workflow)
}

function engineeringWorkflowStatuses(codes) {
  return codes
    .filter(code => engineeringStatusNameMap[code])
    .map(code => workflowStatus(code, engineeringStatusNameMap[code]))
}

function statusTransitionRule(ruleName, nodeCode, outputResult, targetStatusCode) {
  return {
    id: `status-rule-${nodeCode}-${outputResult}-${targetStatusCode}`,
    ruleName,
    logicMode: 'all',
    targetStatusCode,
    conditions: [{
      id: `status-condition-${nodeCode}-${outputResult}-${targetStatusCode}`,
      nodeCode,
      outputResult
    }]
  }
}

function engineeringWorkflowConfig(kind) {
  const sapPaymentOutputs = sapPaymentExecutionResultOptions
  const commonStatusTail = [
    statusTransitionRule('承包商确认后进入ACK', 'contractorAck', 'completed', 'ACK', 70),
    statusTransitionRule('承包商执行中后进入INPR', 'contractorExecution', 'inProgress', 'INPR', 80),
    statusTransitionRule('承包商完成上报后进入RTCP', 'contractorExecution', 'completed', 'RTCP', 90),
    statusTransitionRule('PO驳回完工上报后进入RJCP', 'poCompletion', 'rejected', 'RJCP', 100),
    statusTransitionRule('SAP完工认证完成后进入CERT', 'sapPaymentProcess', 'completionCertified', 'CERT', 110),
    statusTransitionRule('SAP创建付款申请后进入PMCR', 'sapPaymentProcess', 'paymentClaimCreated', 'PMCR', 120),
    statusTransitionRule('SAP批量复核后进入BHRV', 'sapPaymentProcess', 'batchReviewing', 'BHRV', 130),
    statusTransitionRule('SAP最终付款完成后进入FPCP', 'sapPaymentProcess', 'completed', 'FPCP', 140)
  ]
  const executionStatusTail = commonStatusTail.filter(rule => !rule.conditions.some(condition => condition.nodeCode === 'contractorAck'))
  const commonTailRoutes = [
    workflowRoute('sapBudgetCheck', 'contractorAck', 'ISSD SAP预算校验通过，签发给承包商'),
    workflowRoute('sapBudgetCheck', 'plan', '预算校验失败，回到方案制定调整预算或方案', 'failed'),
    workflowRoute('contractorAck', 'contractorExecution', 'ACK 承包商确认接单'),
    workflowRoute('contractorExecution', 'poCompletion', 'RTCP 承包商完成上报'),
    workflowRoute('poCompletion', 'contractorExecution', 'RJCP PO驳回完工上报', 'rejected', [], 'reject'),
    workflowRoute('poCompletion', 'sapPaymentProcess', 'CERT PO完工认证通过，进入SAP付款处理'),
    workflowRoute('sapPaymentProcess', 'end', 'FPCP SAP最终付款完成')
  ]
  const tenantTailRoutes = [
    workflowRoute('sapBudgetCheck', 'contractorAck', 'ISSD SAP预算校验通过，签发给承包商'),
    workflowRoute('sapBudgetCheck', 'aoApproval', '预算校验失败，返回AO重新确认预算或方案', 'failed'),
    workflowRoute('contractorAck', 'contractorExecution', 'ACK 承包商确认接单'),
    workflowRoute('contractorExecution', 'poCompletion', 'RTCP 承包商完成上报'),
    workflowRoute('poCompletion', 'contractorExecution', 'RJCP PO驳回完工上报', 'rejected', [], 'reject'),
    workflowRoute('poCompletion', 'sapPaymentProcess', 'CERT PO完工认证通过，进入SAP付款处理'),
    workflowRoute('sapPaymentProcess', 'end', 'FPCP SAP最终付款完成')
  ]
  const projectTailRoutes = [
    workflowRoute('sapBudgetCheck', 'contractorExecution', 'ISSD SAP预算校验通过，进入承包商施工执行'),
    workflowRoute('sapBudgetCheck', 'plan', '预算校验失败，回到方案制定调整预算或方案', 'failed'),
    workflowRoute('contractorExecution', 'poCompletion', 'RTCP 承包商完成上报'),
    workflowRoute('poCompletion', 'contractorExecution', 'RJCP PO驳回完工上报', 'rejected', [], 'reject'),
    workflowRoute('poCompletion', 'sapPaymentProcess', 'CERT PO完工认证通过，进入SAP付款处理'),
    workflowRoute('sapPaymentProcess', 'end', 'FPCP SAP最终付款完成')
  ]

  const tenantStatusCodes = ['CRTE', 'SBMT', 'AORJ', 'AOAP', 'ISSD', 'ACK', 'INPR', 'RTCP', 'RJCP', 'CERT', 'PMCR', 'BHRV', 'FPCP']
  const supportedStatusCodes = ['CRTE', 'SBMT', 'SORJ', 'SOSP', 'AORJ', 'AOAP', 'SAPRJ', 'ISSD', 'ACK', 'INPR', 'RTCP', 'RJCP', 'CERT', 'PMCR', 'BHRV', 'FPCP']
  const projectStatusCodes = supportedStatusCodes.filter(code => code !== 'ACK')
  const capitalStatusCodes = ['CRTE', 'PLAN', 'TAPR', 'TERJ', 'PCAP', 'PCRJ', 'FIAP', 'FIRJ', 'PRCR', 'POGR', 'STOC', 'EXE', 'ACPT', 'ACRJ', 'CERT', 'PMCR', 'BHRV', 'FPCP']
  const configs = {
    tenant: {
      workflowCode: 'WF-ENG-TENANT',
      workflowName: '租户工程工单流程',
      classificationCode: 'ENG-TENANT',
      version: 'v1.1',
      conditionSummary: '工作分类=租户工程且施工主体=租户',
      statusCodes: tenantStatusCodes,
      nodes: [
        node('start', 'PO创建/提交', 'start'),
        planNode(),
        approvalNode('aoApproval', 'AO（授权审批人）审批', 'plan', 'after', '授权审批租户工程申请、费用、施工边界和资料。'),
        sapNode('sapBudgetCheck', 'SAP预算校验', 'sapBudgetCheck', 'contractorAck', 'before', '将工单样本数据发送SAP做预算校验。'),
        contractorNode('contractorAck', '承包商确认接单', '承包商确认接收工单和施工要求。'),
        contractorExecutionNode('承包商或租户施工方进场施工，并在同一节点内输出开工、完成上报等业务结果。'),
        poCompletionNode(),
        sapPaymentProcessNode(),
        node('end', '归档关闭', 'end')
      ],
      routes: [
        workflowRoute('start', 'plan', '创建后进入方案制定'),
        workflowRoute('plan', 'aoApproval', 'SBMT 方案提交AO审批'),
        workflowRoute('aoApproval', 'plan', 'AORJ AO驳回，回到方案制定', 'rejected', [], 'reject'),
        workflowRoute('aoApproval', 'sapBudgetCheck', 'AOAP AO批准', 'approved'),
        ...tenantTailRoutes
      ],
      statusRules: [
        statusTransitionRule('创建后进入CRTE', 'start', 'completed', 'CRTE', 10),
        statusTransitionRule('方案提交后进入SBMT', 'plan', 'completed', 'SBMT', 15),
        statusTransitionRule('AO驳回后进入AORJ', 'aoApproval', 'rejected', 'AORJ', 20),
        statusTransitionRule('AO批准后进入AOAP', 'aoApproval', 'approved', 'AOAP', 30),
        statusTransitionRule('SAP预算校验通过后进入ISSD', 'sapBudgetCheck', 'completed', 'ISSD', 50),
        ...commonStatusTail
      ]
    },
    minor: {
      workflowCode: 'WF-ENG-MINOR',
      workflowName: '小型工程工单流程',
      classificationCode: 'ENG-MINOR',
      version: 'v1.1',
      conditionSummary: '工作分类=小型工程且预算级别=小额',
      statusCodes: supportedStatusCodes,
      nodes: supportedWorkflowNodes('PSC'),
      routes: supportedWorkflowRoutes('PSC'),
      statusRules: supportedWorkflowStatusRules()
    },
    project: {
      workflowCode: 'WF-ENG-PROJECT',
      workflowName: '项目工程工单流程',
      classificationCode: 'ENG-PROJECT',
      version: 'v1.2',
      conditionSummary: '工作分类=项目工程且预算金额>=阈值',
      statusCodes: projectStatusCodes,
      nodes: supportedWorkflowNodes('PSA', { includeContractorAck: false }),
      routes: supportedWorkflowRoutes('PSA', { tailRoutes: projectTailRoutes }),
      statusRules: supportedWorkflowStatusRules({ includeContractorAck: false, tailRules: executionStatusTail })
    },
    capital: {
      workflowCode: 'WF-ENG-CAPITAL',
      workflowName: 'CAPEX改造流程',
      classificationCode: 'ENG-CAPITAL',
      version: 'v1.0',
      conditionSummary: '工作分类=CAPEX改造且涉及采购、库存占用和资本化付款',
      statusCodes: capitalStatusCodes,
      nodes: [
        node('start', '创建', 'start', {
          statusOutputOptions: [
            { value: 'created', label: '创建' },
            { value: 'completed', label: '提交' }
          ]
        }),
        node('plan', '方案制定', 'workStage', {
          stageTemplate: 'plan',
          executionMode: 'singleExecutor',
          pagePolicy: 'planPage',
          executorSource: 'fixedRole',
          fallbackExecutor: 'projectManager',
          actionSummary: '制定改造范围、技术方案、工期计划、预算和采购需求。'
        }),
        approvalNode('technicalApproval', '技术审批', 'plan', 'after', '审核技术方案、施工边界、安全风险和验收标准。'),
        approvalNode('scheduleCostApproval', '进度/成本审批', 'plan', 'after', '审核施工进度计划、成本预算、资源占用和项目约束。'),
        approvalNode('financeApproval', '财务审批', 'plan', 'after', '审核资本化、预算科目、付款条件和财务合规要求。'),
        sapNode('purchasePr', '采购PR', 'purchasePrCreate', 'plan', 'after', '按审批后的工程方案创建采购申请。', { inlineSystemTask: true }),
        sapNode('purchasePoReceipt', '采购PO入库', 'purchasePoReceipt', 'plan', 'after', '跟踪采购订单、到货入库和供应状态。', { inlineSystemTask: true }),
        sapNode('inventoryReserve', '库存占用', 'inventoryReserve', 'engineeringExecution', 'before', '按工程任务占用库存、锁定物料或服务资源。', { inlineSystemTask: true }),
        node('engineeringExecution', '改造执行', 'workStage', {
          stageTemplate: 'execute',
          executionMode: 'multiExecutorAll',
          pagePolicy: 'repairExecutionPage',
          executorSource: 'fixedRole',
          fallbackExecutor: 'projectManager',
          assignmentEnabledSwitch: 'uncheck',
          assignmentMode: 'system',
          assignmentTargetType: 'role',
          assignmentTarget: 'projectManager',
          actionSummary: '执行现场改造、记录进度、问题、变更、照片和安全措施。'
        }),
        node('engineeringAcceptance', '改造验收', 'workStage', {
          stageTemplate: 'acceptance',
          executionMode: 'singleExecutor',
          pagePolicy: 'acceptancePage',
          executorSource: 'fixedRole',
          fallbackExecutor: 'engineeringSupervisor',
          allowRejectSwitch: 'checked',
          rejectTargetNodeCode: 'engineeringExecution',
          actionSummary: '按方案和验收标准确认改造结果、资料、整改项和签字。'
        }),
        sapPaymentProcessNode('engineeringAcceptance', { inlineSystemTask: true }),
        node('end', '归档关闭', 'end')
      ],
      routes: [
        workflowRoute('start', 'plan', '创建提交后进入方案制定', 'completed'),
        workflowRoute('plan', 'technicalApproval', '方案提交技术审批'),
        workflowRoute('technicalApproval', 'plan', '技术审批驳回，回到方案制定', 'rejected', [], 'reject'),
        workflowRoute('technicalApproval', 'scheduleCostApproval', '技术审批通过', 'approved'),
        workflowRoute('scheduleCostApproval', 'plan', '进度/成本审批驳回，回到方案制定', 'rejected', [], 'reject'),
        workflowRoute('scheduleCostApproval', 'financeApproval', '进度/成本审批通过', 'approved'),
        workflowRoute('financeApproval', 'plan', '财务审批驳回，回到方案制定', 'rejected', [], 'reject'),
        workflowRoute('financeApproval', 'purchasePr', '财务审批通过，创建采购PR', 'approved'),
        workflowRoute('purchasePr', 'purchasePoReceipt', '采购PR创建完成'),
        workflowRoute('purchasePoReceipt', 'inventoryReserve', '采购PO入库完成，进入库存占用'),
        workflowRoute('inventoryReserve', 'engineeringExecution', '库存占用完成，进入改造执行'),
        workflowRoute('engineeringExecution', 'engineeringAcceptance', '改造执行完成', 'completed'),
        workflowRoute('engineeringAcceptance', 'engineeringExecution', '验收驳回，回到改造执行', 'rejected', [], 'reject'),
        workflowRoute('engineeringAcceptance', 'sapPaymentProcess', '改造验收通过，进入SAP付款处理'),
        workflowRoute('sapPaymentProcess', 'end', 'SAP最终付款完成')
      ],
      statusRules: [
        statusTransitionRule('创建后进入CRTE', 'start', 'created', 'CRTE'),
        statusTransitionRule('提交后进入PLAN', 'start', 'completed', 'PLAN'),
        statusTransitionRule('方案提交后进入TAPR', 'plan', 'completed', 'TAPR'),
        statusTransitionRule('技术审批驳回后进入TERJ', 'technicalApproval', 'rejected', 'TERJ'),
        statusTransitionRule('技术审批通过后进入PCAP', 'technicalApproval', 'approved', 'PCAP'),
        statusTransitionRule('进度/成本审批驳回后进入PCRJ', 'scheduleCostApproval', 'rejected', 'PCRJ'),
        statusTransitionRule('进度/成本审批通过后进入FIAP', 'scheduleCostApproval', 'approved', 'FIAP'),
        statusTransitionRule('财务审批驳回后进入FIRJ', 'financeApproval', 'rejected', 'FIRJ'),
        statusTransitionRule('采购PR创建后进入PRCR', 'purchasePr', 'completed', 'PRCR'),
        statusTransitionRule('采购PO入库后进入POGR', 'purchasePoReceipt', 'completed', 'POGR'),
        statusTransitionRule('库存占用后进入STOC', 'inventoryReserve', 'completed', 'STOC'),
        statusTransitionRule('改造执行中后进入EXE', 'engineeringExecution', 'inProgress', 'EXE'),
        statusTransitionRule('改造执行完成后进入ACPT', 'engineeringExecution', 'completed', 'ACPT'),
        statusTransitionRule('验收驳回后进入ACRJ', 'engineeringAcceptance', 'rejected', 'ACRJ'),
        statusTransitionRule('SAP完工认证完成后进入CERT', 'sapPaymentProcess', 'completionCertified', 'CERT'),
        statusTransitionRule('SAP创建付款申请后进入PMCR', 'sapPaymentProcess', 'paymentClaimCreated', 'PMCR'),
        statusTransitionRule('SAP批量复核后进入BHRV', 'sapPaymentProcess', 'batchReviewing', 'BHRV'),
        statusTransitionRule('SAP最终付款完成后进入FPCP', 'sapPaymentProcess', 'completed', 'FPCP')
      ]
    }
  }
  return configs[kind]

  function supportedWorkflowNodes(conditionLabel, options = {}) {
    const includeContractorAck = options.includeContractorAck !== false
    return [
      node('start', 'PO创建/提交', 'start'),
      planNode(),
      approvalNode('soSupport', 'SO（支持审批人）审核', 'plan', 'after', `当${conditionLabel}=是时，支持审批人审核资料、预算或现场可行性。`),
      approvalNode('aoApproval', 'AO（授权审批人）审批', 'plan', 'after', `当${conditionLabel}=否时可跳过SO，授权审批工单预算、施工边界和执行责任。`),
      sapNode('sapBudgetCheck', 'SAP预算校验', 'sapBudgetCheck', includeContractorAck ? 'contractorAck' : 'contractorExecution', 'before', '将工单样本数据发送SAP做预算校验。'),
      ...(includeContractorAck ? [contractorNode('contractorAck', '承包商确认接单', '承包商确认接收工单和施工要求。')] : []),
      contractorExecutionNode('承包商进场施工，并在同一节点内输出开工、完成上报等业务结果。'),
      poCompletionNode(),
      sapPaymentProcessNode(),
      node('end', '归档关闭', 'end')
    ]
  }

  function supportedWorkflowRoutes(conditionLabel, options = {}) {
    const conditionField = conditionLabel === 'PSC' ? 'pscRequired' : 'psaRequired'
    const tailRoutes = options.tailRoutes || commonTailRoutes
    return [
      workflowRoute('start', 'plan', '创建后进入方案制定'),
      workflowRoute('plan', 'soSupport', `SBMT 方案提交，${conditionLabel}=是，进入SO支持审核`, 'completed', [conditionRule(conditionField, 'eq', '是')]),
      workflowRoute('plan', 'aoApproval', `SBMT 方案提交，${conditionLabel}=否，跳过SO直接进入AO审批`, 'completed', [conditionRule(conditionField, 'eq', '否')]),
      workflowRoute('soSupport', 'plan', 'SORJ SO驳回，回到方案制定', 'rejected', [], 'reject'),
      workflowRoute('soSupport', 'aoApproval', 'SOSP SO支持通过', 'approved'),
      workflowRoute('aoApproval', 'plan', 'AORJ AO驳回，回到方案制定', 'rejected', [], 'reject'),
      workflowRoute('aoApproval', 'sapBudgetCheck', 'AOAP AO批准', 'approved'),
      ...tailRoutes
    ]
  }

  function supportedWorkflowStatusRules(options = {}) {
    const tailRules = options.tailRules || commonStatusTail
    return [
      statusTransitionRule('创建后进入CRTE', 'start', 'completed', 'CRTE', 10),
      statusTransitionRule('方案提交后进入SBMT', 'plan', 'completed', 'SBMT', 15),
      statusTransitionRule('SO驳回后进入SORJ', 'soSupport', 'rejected', 'SORJ', 20),
      statusTransitionRule('SO支持通过后进入SOSP', 'soSupport', 'approved', 'SOSP', 30),
      statusTransitionRule('AO驳回后进入AORJ', 'aoApproval', 'rejected', 'AORJ', 40),
      statusTransitionRule('AO批准后进入AOAP', 'aoApproval', 'approved', 'AOAP', 50),
      statusTransitionRule('SAP预算校验失败后进入SAPRJ', 'sapBudgetCheck', 'failed', 'SAPRJ', 60),
      statusTransitionRule('SAP预算校验通过后进入ISSD', 'sapBudgetCheck', 'completed', 'ISSD', 70),
      ...tailRules
    ]
  }

  function planNode() {
    return node('plan', '方案制定', 'workStage', {
      stageTemplate: 'plan',
      executionMode: 'singleExecutor',
      pagePolicy: 'planPage',
      executorSource: 'creator',
      actionSummary: '制定工程改造范围、施工方案、预算口径、风险约束和审批资料。'
    })
  }

  function contractorExecutionNode(actionSummary) {
    return contractorNode('contractorExecution', '承包商施工执行', actionSummary)
  }

function sapPaymentProcessNode(targetStageCode = 'poCompletion', extra = {}) {
  return sapNode('sapPaymentProcess', 'SAP付款处理', 'sapPaymentProcess', targetStageCode, 'after', '接收付款申请、批量复核和最终付款结果，并按输出结果同步单据主状态。', {
    statusOutputOptions: sapPaymentOutputs,
    ...extra
  })
}
}

function approvalNode(nodeCode, nodeName, targetStageCode, position, actionSummary) {
  return node(nodeCode, nodeName, 'approvalFlow', {
    pagePolicy: 'approvalPage',
    approvalFlow: 'approval-engineering-budget',
    targetStageCode,
    position,
    actionSummary
  })
}

function sapNode(nodeCode, nodeName, systemActionTemplate, targetStageCode, position, actionSummary, extra = {}) {
  return node(nodeCode, nodeName, 'systemTask', {
    pagePolicy: 'archivePage',
    systemActionTemplate,
    targetStageCode,
    position,
    systemActionFailure: systemActionTemplate === 'sapBudgetCheck' ? 'block' : 'manualCompensate',
    notifyTarget: 'systemAdmin',
    actionSummary,
    ...extra
  })
}

function contractorNode(nodeCode, nodeName, actionSummary, extra = {}) {
  return node(nodeCode, nodeName, 'workStage', {
    stageTemplate: 'execute',
    executionMode: 'singleExecutor',
    pagePolicy: 'externalPage',
    actionSummary,
    ...extra
  })
}

function poCompletionNode() {
  return node('poCompletion', 'PO完工认证', 'workStage', {
    executionMode: 'singleExecutor',
    pagePolicy: 'acceptancePage',
    allowRejectSwitch: 'checked',
    rejectTargetNodeCode: 'contractorExecution',
    actionSummary: 'PO确认承包商完工结果，认证后进入SAP付款链路。'
  })
}

function engineeringKindByClassification(classificationCode) {
  const normalizedCode = normalizeClassificationCode(classificationCode)
  const map = {
    'ENG-TENANT': 'tenant',
    'ENG-MINOR': 'minor',
    'ENG-PROJECT': 'project',
    'ENG-CAPITAL': 'capital'
  }
  return map[normalizedCode] || ''
}

function engineeringWorkflowPreset(classificationCode) {
  const kind = engineeringKindByClassification(classificationCode)
  return kind ? engineeringWorkflowConfig(kind) : null
}

function applyEngineeringWorkflowPreset(workflow) {
  const config = engineeringWorkflowPreset(workflow?.classificationCode)
  if (!config) return false
  workflow.workflowName = config.workflowName
  workflow.version = config.version
  workflow.conditionSummary = summarizeConditionRules(workflow.conditionRules) || config.conditionSummary
  applyWorkflowRoutes(workflow, config.routes)
  applyEngineeringStatusConfiguration(workflow, config.statusCodes, config.statusRules)
  return true
}

function createDefaultWorkflows() {
  return [
  createConfiguredFlow('WF-INS-DAY', '楼层公共区日常巡检流程', 'INS-DAY', 'v1.3', 'published', true, '工作分类=日常巡检且巡检计划=公共区日常巡检计划', [
    node('start', '计划生成', 'start'),
    node('execute', '巡检执行', 'workStage', {
      executionMode: 'candidateAnyOne',
      pagePolicy: 'inspectionExecutionPage',
      executorSource: 'inheritDispatch',
      fallbackExecutor: 'inspectionLeader',
      assignmentEnabledSwitch: 'checked',
      assignmentMode: 'manual',
      assignmentTargetType: 'role',
      assignmentTarget: 'inspectionLeader',
      actionSummary: '打卡、记录巡检项、拍照、登记异常、提交巡检结果'
    }),
    node('review', '巡检抽检复核', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'inspectionLeader',
      allowRejectSwitch: 'checked',
      rejectTargetNodeCode: 'execute',
      actionSummary: '抽检巡检结果、确认异常处置路径、退回补充'
    }),
    node('end', '归档关闭', 'end')
  ], ['启动', '派工完成', '提交巡检结果', '复核通过'], [
    workflowRoute('start', 'execute-schedule-dispatch', '启动'),
    workflowRoute('execute-schedule-dispatch', 'execute', '派工完成'),
    workflowRoute('execute', 'review', '提交巡检结果'),
    workflowRoute('review', 'end', '复核通过'),
    workflowRoute('review', 'execute', '退回补充', 'rejected', [], 'reject')
  ]),
  createConfiguredFlow('WF-INS-ROOM', '设备房巡检流程', 'INS-ROOM', 'v1.1', 'published', true, '工作分类=设备房巡检且巡检计划=设备房巡检计划且业务分类=强电', [
    node('start', '计划生成', 'start'),
    node('execute', '设备房巡检执行', 'workStage', {
      executionMode: 'multiExecutorAll',
      pagePolicy: 'inspectionExecutionPage',
      executorSource: 'inheritDispatch',
      fallbackExecutor: 'inspectionLeader',
      assignmentEnabledSwitch: 'checked',
      assignmentMode: 'manual',
      assignmentTargetType: 'role',
      assignmentTarget: 'inspectionLeader',
      actionSummary: '设备房到场打卡、关键点位检查、仪表读数、照片和异常登记'
    }),
    node('review', '主管复核', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'engineeringSupervisor',
      allowRejectSwitch: 'checked',
      rejectTargetNodeCode: 'execute',
      actionSummary: '复核关键房间巡检结果、异常处置和照片完整性'
    }),
    node('end', '归档关闭', 'end')
  ], ['启动', '派工完成', '提交巡检结果', '复核通过'], [
    workflowRoute('start', 'execute-schedule-dispatch', '启动'),
    workflowRoute('execute-schedule-dispatch', 'execute', '派工完成'),
    workflowRoute('execute', 'review', '提交巡检结果'),
    workflowRoute('review', 'end', '复核通过'),
    workflowRoute('review', 'execute', '退回补充', 'rejected', [], 'reject')
  ]),
  createConfiguredFlow('WF-INS-SYSTEM-HVAC', '暖通系统巡检流程', 'INS-SYSTEM', 'v1.0', 'published', true, '工作分类=专业系统巡检且巡检计划=暖通系统巡检计划且业务分类=暖通', [
    node('start', '计划生成', 'start'),
    node('execute', '系统巡检执行', 'workStage', {
      executionMode: 'multiExecutorAll',
      pagePolicy: 'inspectionExecutionPage',
      executorSource: 'inheritDispatch',
      fallbackExecutor: 'inspectionLeader',
      assignmentEnabledSwitch: 'checked',
      assignmentMode: 'manual',
      assignmentTargetType: 'role',
      assignmentTarget: 'inspectionLeader',
      actionSummary: '检查系统运行状态、记录参数、上传仪表读数和异常照片'
    }),
    node('review', '专业复核', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'engineeringSupervisor',
      allowRejectSwitch: 'checked',
      rejectTargetNodeCode: 'execute',
      actionSummary: '复核专业参数、异常判断和后续处置路径'
    }),
    node('end', '归档关闭', 'end')
  ], ['启动', '派工完成', '提交巡检结果', '复核通过'], [
    workflowRoute('start', 'execute-schedule-dispatch', '启动'),
    workflowRoute('execute-schedule-dispatch', 'execute', '派工完成'),
    workflowRoute('execute', 'review', '提交巡检结果'),
    workflowRoute('review', 'end', '复核通过'),
    workflowRoute('review', 'execute', '退回补充', 'rejected', [], 'reject')
  ]),
  createConfiguredFlow('WF-INS-OUT', '外委巡检流程', 'INS-OUT', 'v1.0', 'published', true, '工作分类=外委巡检且巡检计划=外委巡检计划', [
    node('start', '计划生成', 'start'),
    node('externalExecute', '外委巡检执行', 'businessFlow', {
      executionMode: 'singleExecutor',
      pagePolicy: 'externalPage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'supplierManager',
      actionSummary: '供应商接单、到场执行、上传巡检报告和异常清单'
    }),
    node('ownerReview', '甲方抽查验收', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'engineeringSupervisor',
      allowRejectSwitch: 'checked',
      rejectTargetNodeCode: 'externalExecute',
      actionSummary: '甲方工程人员抽查外委巡检质量、确认报告和异常处置'
    }),
    node('end', '归档关闭', 'end')
  ], ['启动', '供应商提交', '验收通过'], [
    workflowRoute('start', 'externalExecute', '启动'),
    workflowRoute('externalExecute', 'ownerReview', '供应商提交'),
    workflowRoute('ownerReview', 'end', '验收通过'),
    workflowRoute('ownerReview', 'externalExecute', '退回供应商补充', 'rejected', [], 'reject')
  ]),
  createConfiguredFlow('WF-INS-FIRE', '消防安全巡检流程', 'INS-FIRE', 'v1.0', 'published', true, '工作分类=消防安全巡检且巡检计划=消防安全巡检计划且业务分类=消防', [
    node('start', '计划生成', 'start'),
    node('execute', '消防安全巡检执行', 'workStage', {
      executionMode: 'multiExecutorAll',
      pagePolicy: 'inspectionExecutionPage',
      executorSource: 'inheritDispatch',
      fallbackExecutor: 'inspectionLeader',
      assignmentEnabledSwitch: 'checked',
      assignmentMode: 'manual',
      assignmentTargetType: 'role',
      assignmentTarget: 'inspectionLeader',
      actionSummary: '检查消防设施、通道、报警系统和合规隐患，记录照片和处置结果'
    }),
    node('review', '消防合规复核', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'engineeringSupervisor',
      allowRejectSwitch: 'checked',
      rejectTargetNodeCode: 'execute',
      actionSummary: '复核消防隐患处置路径、照片证据和资料完整性'
    }),
    node('end', '归档关闭', 'end')
  ], ['启动', '派工完成', '提交巡检结果', '复核通过'], [
    workflowRoute('start', 'execute-schedule-dispatch', '启动'),
    workflowRoute('execute-schedule-dispatch', 'execute', '派工完成'),
    workflowRoute('execute', 'review', '提交巡检结果'),
    workflowRoute('review', 'end', '复核通过'),
    workflowRoute('review', 'execute', '退回补充', 'rejected', [], 'reject')
  ]),
  createFlow('WF-MAIN-EQUIP', '电梯维保流程', 'MAIN-EQUIP', 'v1.1', 'published', true, '工作分类=专业设备维保且设备专业=电梯', [
    node('start', '计划生成', 'start'),
    node('dispatch', '分配调度', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'dispatchPage', actionSummary: '确认班组、工具和窗口期' }),
    node('material', '物料申请', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'materialPage', actionSummary: '申请备件、记录领用' }),
    node('execute', '维保执行', 'workStage', { executionMode: 'multiExecutorAll', pagePolicy: 'maintenanceExecutionPage', actionSummary: '执行作业、记录参数、提交报告' }),
    node('review', '复核验收', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '验收结果、退回整改' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '需要备件', '备件到位', '提交报告', '验收通过']),
  createFlow('WF-MAIN-SEASON', '冷站供冷季切换维保流程', 'MAIN-SEASON', 'v1.0', 'published', true, '工作分类=季节切换维保且季节=供冷切换', [
    node('start', '计划生成', 'start'),
    node('plan', '切换方案确认', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'planPage', actionSummary: '确认切换方案和停机窗口' }),
    node('approval', '审批处理', 'approvalFlow', { pagePolicy: 'approvalPage', actionSummary: '审批切换窗口和风险措施' }),
    node('execute', '现场切换', 'workStage', { executionMode: 'multiExecutorAll', pagePolicy: 'maintenanceExecutionPage', actionSummary: '执行切换、记录系统参数' }),
    node('review', '运行复核', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '验证运行稳定性' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '方案提交', '审批通过', '完成切换', '复核通过']),
  createFlow('WF-MAIN-OUT', '消防系统外委维保流程', 'MAIN-OUT', 'v1.0', 'published', true, '工作分类=外委维保且设备专业=消防且外委方式=框架合同', [
    node('start', '工单生成', 'start'),
    node('approval', '外委审批', 'approvalFlow', { pagePolicy: 'approvalPage', actionSummary: '确认合同、费用、作业窗口' }),
    node('external', '外委协同', 'businessFlow', { pagePolicy: 'externalPage', actionSummary: '供应商接单、反馈、上传报告' }),
    node('review', '复核验收', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '验收报告、退回供应商' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '审批通过', '供应商提交', '验收通过']),
  createFlow('WF-REP-DIAG', '给排水故障排查维修流程', 'REP-DIAG', 'v1.0', 'published', true, '工作分类=故障排查维修且业务分类=给排水', [
    node('start', '报修生成', 'start'),
    node('diagnosis', '故障诊断', 'workStage', { executionMode: 'candidateAnyOne', pagePolicy: 'repairDiagnosisPage', actionSummary: '定位故障、判断是否需转派' }),
    node('material', '资源申请', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'materialPage', actionSummary: '申请物料、人力或停机窗口' }),
    node('execute', '维修执行', 'workStage', { executionMode: 'multiExecutorAnyOne', pagePolicy: 'repairExecutionPage', actionSummary: '处理故障、记录恢复情况' }),
    node('review', '维修验收', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '确认恢复、退回返工' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '需资源', '资源到位', '恢复正常', '验收通过']),
  createFlow('WF-REP-SYSTEM-HVAC', '暖通专业维修流程', 'REP-SYSTEM', 'v0.8', 'draft', false, '工作分类=专业系统维修且业务分类=暖通', [
    node('start', '维修生成', 'start'),
    node('dispatch', '专业派工', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'dispatchPage', actionSummary: '按系统专业派工' }),
    node('diagnosis', '系统诊断', 'workStage', { executionMode: 'multiExecutorAll', pagePolicy: 'repairDiagnosisPage', actionSummary: '核查系统影响范围' }),
    node('execute', '维修执行', 'workStage', { executionMode: 'multiExecutorAll', pagePolicy: 'repairExecutionPage', actionSummary: '维修、联调、参数复测' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '暖通专业', '确认方案', '恢复运行']),
  createFlow('WF-REP-EMG', '电梯困人应急抢修流程', 'REP-EMG', 'v1.0', 'published', true, '工作分类=应急抢修且风险等级=高且设备专业=电梯', [
    node('start', '紧急生成', 'start'),
    node('dispatch', '抢修调度', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'dispatchPage', actionSummary: '快速派工、升级通知' }),
    node('execute', '抢修执行', 'workStage', { executionMode: 'multiExecutorAnyOne', pagePolicy: 'repairExecutionPage', actionSummary: '抢修处理、临时恢复、申请支援' }),
    node('review', '恢复确认', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '确认安全恢复' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '高风险', '恢复正常', '确认通过']),
  createFlow('WF-REP-OUT', '高压配电外委维修流程', 'REP-OUT', 'v1.0', 'published', true, '工作分类=外委维修且设备专业=高压配电', [
    node('start', '维修生成', 'start'),
    node('approval', '外委审批', 'approvalFlow', { pagePolicy: 'approvalPage', actionSummary: '确认外委原因、费用和供应商' }),
    node('external', '外委协同', 'businessFlow', { pagePolicy: 'externalPage', actionSummary: '供应商接单、维修反馈' }),
    node('review', '维修验收', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptancePage', actionSummary: '验收、退回供应商' }),
    node('end', '归档关闭', 'end')
  ], ['默认', '审批通过', '供应商提交', '验收通过']),
  createFlow('WF-SR-USER', '报事服务受理派工流程', 'SR-USER', 'v1.0', 'published', true, '工作分类=用户报事且来源类型=用户报事', [
    node('start', '用户提交', 'start'),
    node('accept', '受理分类', 'workStage', { executionMode: 'candidateAnyOne', pagePolicy: 'acceptPage', actionSummary: '分类、补充信息、转派' }),
    node('dispatch', '派生工单', 'systemTask', { pagePolicy: 'dispatchPage', actionSummary: '按分类生成巡检、维修或改造工单' }),
    node('callback', '回访确认', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'callbackPage', actionSummary: '用户确认、回访记录' }),
    node('end', '关闭', 'end')
  ], ['默认', '受理完成', '处理完成', '确认通过']),
  createFlow('WF-SR-UPGRADE', '投诉升级处理流程', 'SR-UPGRADE', 'v0.9', 'draft', false, '工作分类=报事升级且来源类型=用户报事', [
    node('start', '升级触发', 'start'),
    node('accept', '升级受理', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'acceptPage', actionSummary: '确认升级原因' }),
    node('approval', '升级审批', 'approvalFlow', { pagePolicy: 'approvalPage', actionSummary: '审批责任和资源' }),
    node('dispatch', '分配调度', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'dispatchPage', actionSummary: '派生处理单据' }),
    node('end', '关闭', 'end')
  ], ['默认', '确认升级', '审批通过', '已派生']),
  createEngineeringWorkflow('tenant'),
  createEngineeringWorkflow('minor'),
  createEngineeringWorkflow('project'),
  createEngineeringWorkflow('capital'),
  createFlow('WF-AST-STATE', '设备资产停用流程', 'AST-STATE', 'v0.6', 'draft', false, '工作分类=资产状态更新且资产状态=停用', [
    node('start', '状态变更申请', 'start'),
    node('review', '台账复核', 'workStage', { executionMode: 'singleExecutor', pagePolicy: 'assetPage', actionSummary: '核对资产、位置、责任人' }),
    node('update', '状态更新', 'systemTask', { pagePolicy: 'assetPage', actionSummary: '更新资产状态和关联记录' }),
    node('end', '关闭', 'end')
  ], ['默认', '复核通过', '更新完成'])
  ]
}

function loadStoredWorkflows() {
  if (typeof window === 'undefined') return createDefaultWorkflows()
  try {
    const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY)
    if (!raw) return createDefaultWorkflows()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaultWorkflows()
    const normalized = normalizeWorkflowList(parsed)
    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch (error) {
    return createDefaultWorkflows()
  }
}

function hasLocalStoredWorkflows() {
  return typeof window !== 'undefined' && !!window.localStorage.getItem(WORKFLOW_STORAGE_KEY)
}

function ensureRequiredWorkflowPresets(items) {
  const existingCodes = new Set(items.map(item => item.workflowCode))
  const requiredEngineeringPresets = [
    createEngineeringWorkflow('capital')
  ].filter(item => !existingCodes.has(item.workflowCode))
  return [...items, ...requiredEngineeringPresets]
}

function migrateLegacyWorkflow(workflow) {
  const migration = legacyEngineeringWorkflowMap[workflow?.workflowCode]
  const migrated = migration ? { ...workflow, ...migration } : { ...workflow }
  migrated.classificationCode = normalizeClassificationCode(migrated.classificationCode)
  if (Array.isArray(migrated.conditionRules)) {
    migrated.conditionRules = migrated.conditionRules.map(normalizeClassificationConditionRule)
  }
  return migrated
}

function dedupeWorkflows(items) {
  const map = new Map()
  items.forEach(item => {
    if (!item?.workflowCode) return
    if (!map.has(item.workflowCode)) map.set(item.workflowCode, item)
  })
  return Array.from(map.values())
}

function normalizeStoredWorkflow(workflow) {
  workflow.classificationCode = normalizeClassificationCode(workflow.classificationCode)
  workflow.workTypeCode = workflow.workTypeCode || classificationWorkType(workflow.classificationCode)
  const storedSkeleton = storedWorkflowSkeletonState(workflow)
  const baseNodes = storedSkeleton.baseNodes
  workflow.skeletonVersion = skeletonVersionByWorkType(workflow.workTypeCode || classificationWorkType(workflow.classificationCode))
  workflow.baseNodes = baseNodes
  workflow.nodes = storedSkeleton.refreshed ? cloneWorkflowNodes(baseNodes, workflow.workTypeCode) : normalizeWorkflowNodes(workflow.nodes || baseNodes, workflow.workTypeCode)
  workflow.conditionRules = Array.isArray(workflow.conditionRules) ? workflow.conditionRules.map(normalizeClassificationConditionRule) : defaultConditionRules(workflow.classificationCode, workflow.conditionSummary)
  workflow.conditionSummary = summarizeConditionRules(workflow.conditionRules) || workflow.conditionSummary
  workflow.stageStrategies = storedSkeleton.refreshed || !Array.isArray(workflow.stageStrategies) ? buildStageStrategies(baseNodes, workflow.classificationCode) : workflow.stageStrategies
  workflow.approvalConfigs = storedSkeleton.refreshed || !Array.isArray(workflow.approvalConfigs) ? buildApprovalConfigs(baseNodes, workflow.classificationCode, workflow.stageStrategies) : workflow.approvalConfigs
  workflow.systemNodeConfigs = storedSkeleton.refreshed || !Array.isArray(workflow.systemNodeConfigs) ? buildSystemNodeConfigs(baseNodes, workflow.workTypeCode, workflow.stageStrategies) : workflow.systemNodeConfigs
  workflow.systemNodeConfigs = mergeSystemNodeConfigsWithTemplates(workflow, baseNodes)
  workflow.deletedApprovalNodeCodes = Array.isArray(workflow.deletedApprovalNodeCodes) ? workflow.deletedApprovalNodeCodes : []
  if (storedSkeleton.refreshed) rebuildWorkflowByStrategies(workflow)
  workflow.routes = storedSkeleton.refreshed
    ? applyStoredRouteRules(buildGeneratedRoutes(workflow.nodes, storedSkeleton.routeLabels), workflow.routes || [], workflow.nodes, workflow)
    : Array.isArray(workflow.routes) ? applyStoredRouteRules(buildGeneratedRoutes(workflow.nodes), workflow.routes || [], workflow.nodes, workflow) : buildGeneratedRoutes(workflow.nodes)
  workflow.routeConditionRules = Array.isArray(workflow.routeConditionRules) ? workflow.routeConditionRules : []
  workflow.disabledRouteRules = Array.isArray(workflow.disabledRouteRules) ? workflow.disabledRouteRules : []
  const tenantAoRepaired = ensureTenantAoApprovalRepair(workflow)
  const capitalDispatchRepaired = ensureCapitalDispatchConfigRepair(workflow)
  if (tenantAoRepaired || capitalDispatchRepaired) {
    rebuildWorkflowByStrategies(workflow)
  }
  normalizeWorkflowStatusSettings(workflow)
  if (storedSkeleton.refreshed && workflow.workTypeCode === 'engineeringChange' && workflow.preset === true) applyEngineeringWorkflowPreset(workflow)
  normalizeStageAssignmentStrategies(workflow)
  applyStageLockRules(workflow)
  ensureWorkflowDataPermissionSettings(workflow)
  return workflow
}

function storedWorkflowSkeletonState(workflow) {
  const workTypeCode = workflow.workTypeCode || classificationWorkType(workflow.classificationCode)
  const engineeringPreset = workTypeCode === 'engineeringChange' && workflow.preset === true ? engineeringWorkflowPreset(workflow.classificationCode) : null
  const canonicalSkeleton = engineeringPreset || canonicalWorkflowSkeleton(workTypeCode)
  const storedNodes = workflow.baseNodes || workflow.nodes || []
  const expectedVersion = skeletonVersionByWorkType(workTypeCode)
  const shouldRefresh = workTypeCode === 'engineeringChange'
    && canonicalSkeleton
    && workflow.skeletonVersion !== expectedVersion
  return {
    refreshed: shouldRefresh,
    routeLabels: canonicalSkeleton?.routeLabels || [],
    baseNodes: cloneWorkflowNodes(shouldRefresh ? canonicalSkeleton.nodes : storedNodes, workTypeCode)
  }
}

function ensureTenantAoApprovalRepair(workflow) {
  if (!workflow || workflow.workflowCode !== 'WF-ENG-TENANT') return false
  const preset = engineeringWorkflowConfig('tenant')
  const presetAoNode = preset.nodes.find(item => item.nodeCode === 'aoApproval')
  if (!presetAoNode) return false

  let repaired = false
  const baseNodes = Array.isArray(workflow.baseNodes) ? workflow.baseNodes : []
  if (!baseNodes.some(item => item.nodeCode === 'aoApproval')) {
    const insertIndex = baseNodes.findIndex(item => item.nodeCode === 'plan')
    const nextNode = normalizeWorkflowNodes([presetAoNode], workflow.workTypeCode)[0]
    if (insertIndex >= 0) baseNodes.splice(insertIndex + 1, 0, nextNode)
    else baseNodes.push(nextNode)
    workflow.baseNodes = baseNodes
    repaired = true
  }

  workflow.approvalConfigs = Array.isArray(workflow.approvalConfigs) ? workflow.approvalConfigs : []
  const existingAoConfig = workflow.approvalConfigs.find(item => item.nodeCode === 'aoApproval' || item.approvalNodeName === presetAoNode.nodeName)
  const aoApprovalDeleted = (workflow.deletedApprovalNodeCodes || []).includes('aoApproval')
  if (!existingAoConfig && !aoApprovalDeleted) {
    workflow.approvalConfigs.push({
      id: `approval-${approvalSeq++}`,
      nodeCode: 'aoApproval',
      approvalNodeName: presetAoNode.nodeName,
      enabledSwitch: 'checked',
      position: 'after',
      targetStageCode: 'plan',
      approvalFlow: presetAoNode.approvalFlow || approvalFlowByWorkType(workflow.workTypeCode),
      rejectPolicy: presetAoNode.rejectPolicy || 'returnPreviousStage',
      executionPageDataPermissions: normalizeDataPermissions(presetAoNode.executionPageDataPermissions, presetAoNode, workflow)
    })
    repaired = true
  } else if (existingAoConfig) {
    const availableTargetCodes = new Set(approvalTargetNodes(workflow).map(item => item.nodeCode))
    const fallbackTargetCode = availableTargetCodes.has('plan')
      ? 'plan'
      : defaultApprovalTargetNode(workflow)?.nodeCode || ''
    const nextConfig = {
      nodeCode: existingAoConfig.nodeCode || 'aoApproval',
      approvalNodeName: existingAoConfig.approvalNodeName || presetAoNode.nodeName,
      enabledSwitch: existingAoConfig.enabledSwitch || 'checked',
      position: existingAoConfig.position || 'after',
      targetStageCode: availableTargetCodes.has(existingAoConfig.targetStageCode)
        ? existingAoConfig.targetStageCode
        : fallbackTargetCode,
      approvalFlow: existingAoConfig.approvalFlow || presetAoNode.approvalFlow || approvalFlowByWorkType(workflow.workTypeCode),
      rejectPolicy: existingAoConfig.rejectPolicy || 'returnPreviousStage'
    }
    const changed = Object.keys(nextConfig).some(key => existingAoConfig[key] !== nextConfig[key])
    if (changed) {
      Object.assign(existingAoConfig, nextConfig)
      repaired = true
    }
  }
  if (!aoApprovalDeleted && existingAoConfig?.enabledSwitch === 'checked' && !(workflow.nodes || []).some(item => item.nodeCode === 'aoApproval')) {
    repaired = true
  }

  const isLegacyDirectBudgetRoute = route => route?.sourceNodeCode === 'plan' && route?.targetNodeCode === 'sapBudgetCheck'
  const isLegacyTenantBudgetRejectRoute = route => route?.sourceNodeCode === 'sapBudgetCheck' && route?.targetNodeCode === 'plan' && (route.sourceStatus || 'completed') === 'failed'
  const tenantBudgetRejectRoute = routeToStoredRouteRule(
    workflowRoute('sapBudgetCheck', 'aoApproval', '预算校验失败，返回AO重新确认预算或方案', 'failed'),
    workflow.nodes || workflow.baseNodes || []
  )
  const tenantBudgetRejectKey = routeConditionRuleKey(tenantBudgetRejectRoute)
  if (workflow.tenantAoRepairVersion !== TENANT_AO_REPAIR_VERSION) {
    const beforeRouteCount = (workflow.routes || []).length + (workflow.routeConditionRules || []).length + (workflow.disabledRouteRules || []).length
    workflow.routes = (workflow.routes || []).filter(route => !isLegacyDirectBudgetRoute(route) && !isLegacyTenantBudgetRejectRoute(route))
    workflow.routeConditionRules = (workflow.routeConditionRules || []).filter(route => !isLegacyDirectBudgetRoute(route) && !isLegacyTenantBudgetRejectRoute(route))
    workflow.disabledRouteRules = (workflow.disabledRouteRules || []).filter(route => !isLegacyDirectBudgetRoute(route) && !isLegacyTenantBudgetRejectRoute(route))
    const afterRouteCount = workflow.routes.length + workflow.routeConditionRules.length + workflow.disabledRouteRules.length
    if (afterRouteCount !== beforeRouteCount) repaired = true

    const hasTenantBudgetRejectRoute = [
      ...(workflow.routes || []),
      ...(workflow.routeConditionRules || [])
    ].some(route => routeConditionRuleKey(route) === tenantBudgetRejectKey)
    const disabledTenantBudgetRejectRoute = (workflow.disabledRouteRules || []).some(route => routeConditionRuleKey(route) === tenantBudgetRejectKey)
    if (!hasTenantBudgetRejectRoute && !disabledTenantBudgetRejectRoute) {
      workflow.routeConditionRules.push(tenantBudgetRejectRoute)
      repaired = true
    }
    workflow.tenantAoRepairVersion = TENANT_AO_REPAIR_VERSION
    repaired = true
  }

  const statusCountBefore = (workflow.statusDefinitions || []).length + (workflow.statusTransitionRules || []).length
  workflow.statusDefinitions = (workflow.statusDefinitions || []).filter(status => status.statusCode !== 'SAPRJ')
  workflow.statusTransitionRules = (workflow.statusTransitionRules || []).filter(rule => rule.targetStatusCode !== 'SAPRJ')
  const statusCountAfter = workflow.statusDefinitions.length + workflow.statusTransitionRules.length
  if (statusCountAfter !== statusCountBefore) repaired = true

  if (!aoApprovalDeleted) {
    if (ensureStatusDefinition(workflow, 'AORJ')) repaired = true
    if (ensureStatusDefinition(workflow, 'AOAP')) repaired = true
    if (ensureStatusTransitionRule(workflow, statusTransitionRule('AO驳回后进入AORJ', 'aoApproval', 'rejected', 'AORJ'))) repaired = true
    if (ensureStatusTransitionRule(workflow, statusTransitionRule('AO批准后进入AOAP', 'aoApproval', 'approved', 'AOAP'))) repaired = true
  }

  return repaired
}

function ensureCapitalDispatchConfigRepair(workflow) {
  if (!workflow || (workflow.workflowCode !== 'WF-ENG-CAPITAL' && normalizeClassificationCode(workflow.classificationCode) !== 'ENG-CAPITAL')) return false
  if (workflow.capitalDispatchRepairVersion === CAPITAL_DISPATCH_REPAIR_VERSION) return false

  const legacyDispatchNodeCode = 'scheduleDispatch'
  const isLegacyDispatchRoute = route => route?.sourceNodeCode === legacyDispatchNodeCode || route?.targetNodeCode === legacyDispatchNodeCode
  const removeLegacyNode = item => item?.nodeCode !== legacyDispatchNodeCode && item?.stageCode !== legacyDispatchNodeCode
  let repaired = false

  const removeFromList = (key, predicate) => {
    if (!Array.isArray(workflow[key])) return
    const before = workflow[key].length
    workflow[key] = workflow[key].filter(predicate)
    if (workflow[key].length !== before) repaired = true
  }

  removeFromList('baseNodes', removeLegacyNode)
  removeFromList('nodes', removeLegacyNode)
  removeFromList('stageStrategies', removeLegacyNode)
  removeFromList('routes', route => !isLegacyDispatchRoute(route))
  removeFromList('routeConditionRules', route => !isLegacyDispatchRoute(route))
  removeFromList('disabledRouteRules', route => !isLegacyDispatchRoute(route))
  removeFromList('statusDefinitions', status => status.statusCode !== 'DISP')

  if (Array.isArray(workflow.statusTransitionRules)) {
    const before = workflow.statusTransitionRules.length
    workflow.statusTransitionRules = workflow.statusTransitionRules
      .filter(rule => rule.targetStatusCode !== 'DISP')
      .map(rule => ({
        ...rule,
        conditions: (rule.conditions || []).filter(condition => condition.nodeCode !== legacyDispatchNodeCode)
      }))
      .filter(rule => (rule.conditions || []).length > 0)
    if (workflow.statusTransitionRules.length !== before) repaired = true
  }

  const normalizeExecutionAssignment = item => {
    if (!item || !['engineeringExecution', '改造执行'].includes(item.nodeCode || item.stageCode || item.nodeName || item.stageName)) return
    if (item.assignmentEnabledSwitch !== 'uncheck') {
      item.assignmentEnabledSwitch = 'uncheck'
      repaired = true
    }
    if (item.assignmentMode !== 'system') {
      item.assignmentMode = 'system'
      repaired = true
    }
    if (item.executorSource === 'inheritDispatch') {
      item.executorSource = 'fixedRole'
      repaired = true
    }
  }
  ;(workflow.baseNodes || []).forEach(normalizeExecutionAssignment)
  ;(workflow.nodes || []).forEach(normalizeExecutionAssignment)
  ;(workflow.stageStrategies || []).forEach(normalizeExecutionAssignment)

  workflow.capitalDispatchRepairVersion = CAPITAL_DISPATCH_REPAIR_VERSION
  repaired = true
  return repaired
}

function ensureStatusDefinition(workflow, statusCode) {
  if (!Array.isArray(workflow.statusDefinitions) || !statusCode || workflow.statusDefinitions.some(item => item.statusCode === statusCode)) return false
  const statusName = engineeringStatusNameMap[statusCode]
  if (!statusName) return false
  workflow.statusDefinitions.push(workflowStatus(statusCode, statusName))
  return true
}

function ensureStatusTransitionRule(workflow, nextRule) {
  if (!Array.isArray(workflow.statusTransitionRules) || !nextRule?.targetStatusCode) return false
  const exists = workflow.statusTransitionRules.some(rule =>
    rule.targetStatusCode === nextRule.targetStatusCode
    || (rule.conditions || []).some(condition =>
      condition.nodeCode === nextRule.conditions[0]?.nodeCode
      && condition.outputResult === nextRule.conditions[0]?.outputResult
    )
  )
  if (exists) return false
  workflow.statusTransitionRules.push(nextRule)
  return true
}

function skeletonVersionByWorkType(workTypeCode) {
  return workTypeCode === 'engineeringChange' ? ENGINEERING_CHANGE_SKELETON_VERSION : ''
}

function normalizeWorkflowList(items = []) {
  return ensureRequiredWorkflowPresets(dedupeWorkflows(items.map(migrateLegacyWorkflow).map(normalizeStoredWorkflow)))
}

function persistWorkflowsLocally(items = workflows.value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(items))
}

function persistWorkflows() {
  persistWorkflowsLocally(workflows.value)
  void persistSharedWorkflows(workflows.value)
}

async function persistSharedWorkflows(items = workflows.value) {
  try {
    await saveSharedConfig(SHARED_WORKFLOW_CONFIG_KEY, items)
    return true
  } catch (error) {
    showToast('共享配置保存失败，已保存到当前浏览器本地')
    return false
  }
}

async function hydrateSharedWorkflows() {
  hydratingSharedWorkflows = true
  try {
    const response = await fetchSharedConfig(SHARED_WORKFLOW_CONFIG_KEY)
    if (response.exists && Array.isArray(response.data)) {
      const selectedCode = selectedWorkflow.value?.workflowCode
      const normalized = normalizeWorkflowList(response.data)
      workflows.value = normalized
      selectedWorkflow.value = normalized.find(item => item.workflowCode === selectedCode) || normalized[0]
      persistWorkflowsLocally(normalized)
      return
    }
    if (hasLocalStoredWorkflows()) await persistSharedWorkflows(workflows.value)
  } catch (error) {
    showToast('共享配置服务暂不可用，当前使用本地缓存')
  } finally {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        hydratingSharedWorkflows = false
      }, 0)
    } else {
      hydratingSharedWorkflows = false
    }
  }
}

const workflowKeyword = ref('')
const workflowFilter = ref({
  classification: ''
})
const workflowConfigTabs = [
  { id: 'basic', value: 'basic', name: '基础配置' },
  { id: 'nodes', value: 'nodes', name: '流程节点配置' },
  { id: 'status', value: 'status', name: '流程状态配置' }
]
const nodeDetailTabs = [
  { id: 'basic', value: 'basic', name: '基础信息及进入条件' },
  { id: 'execution', value: 'execution', name: '执行规则' },
  { id: 'permissions', value: 'permissions', name: '数据权限' }
]
const activeWorkflowConfigTab = ref('basic')
const activeNodeDetailTab = ref('basic')
const selectedWorkflow = ref(workflows.value[0])
const selectedElement = ref({ type: 'workflow', id: selectedWorkflow.value.workflowCode, data: selectedWorkflow.value })
const routeWarning = ref(false)
const saveMessage = ref('流程结构策略已保存，系统已按策略重算节点、路由和执行人规则。')
const toastVisible = ref(false)
const toastMessage = ref('')
const strategyDirty = ref(false)
const savingStrategy = ref(false)
const canvasNotice = ref('')
const nodeDetailVisible = ref(false)
const selectedNode = ref(null)
const nodeDetailForm = ref({ ...initialNodeDetail, actionPolicies: { ...blankActionPolicies } })
const batchPublishMode = ref(false)
const createWorkflowVisible = ref(false)
const createWorkflowForm = ref(createNewWorkflowForm())
const deleteWorkflowVisible = ref(false)
const workflowPendingDelete = ref(null)
const validationVisible = ref(false)
const validationIssues = ref([])
const validationCheckedAt = ref('')
const canvasDragState = ref({
  active: false,
  didDrag: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0
})
let toastTimer = 0
let workflowPersistTimer = 0
let hydratingSharedWorkflows = false

function scheduleWorkflowPersist() {
  if (hydratingSharedWorkflows || typeof window === 'undefined') return
  if (workflowPersistTimer) window.clearTimeout(workflowPersistTimer)
  workflowPersistTimer = window.setTimeout(() => {
    workflowPersistTimer = 0
    persistWorkflows()
  }, 500)
}

watch(workflows, scheduleWorkflowPersist, { deep: true })

onMounted(() => {
  void refreshSharedClassificationOptions()
  void hydrateSharedWorkflows()
})

onBeforeUnmount(() => {
  if (toastTimer) window.clearTimeout(toastTimer)
  if (workflowPersistTimer) window.clearTimeout(workflowPersistTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', refreshSharedClassificationOptions)
    window.removeEventListener('storage', refreshClassificationOptions)
  }
})

const filteredWorkflows = computed(() => workflows.value.filter(item => {
  const matchKeyword = !workflowKeyword.value || item.workflowName.includes(workflowKeyword.value)
  const matchClassification = !workflowFilter.value.classification || workflowClassificationValues(item).includes(workflowFilter.value.classification)
  return matchKeyword && matchClassification
}))

const workflowTree = computed(() => workTypeOptions.map(type => {
  const children = filteredWorkflows.value.filter(item => item.workTypeCode === type.value)
  return {
    ...type,
    children,
    flowCount: children.length
  }
}).filter(group => group.flowCount > 0))

const publishSelectedCount = computed(() => workflows.value.filter(item => item.publishChecked === 'checked').length)
const statusRuleGroups = computed(() => {
  const workflow = selectedWorkflow.value
  const rules = workflow?.statusTransitionRules || []
  return (workflow?.statusDefinitions || [])
    .map(status => ({
      status,
      rule: rules.find(rule => isStatusRuleForStatus(rule, status))
    }))
    .filter(item => item.rule)
})
const statusRuleNodeOptions = computed(() => (selectedWorkflow.value?.nodes || [])
  .filter(canUseStatusTransitionNode)
  .map(item => ({
    value: item.nodeCode,
    label: item.nodeName
  })))

const validationModalTitle = computed(() => (
  validationIssues.value.length === 0 ? '流程校验结果' : '流程校验未通过项'
))

const stageTargetOptions = computed(() => selectedWorkflow.value.stageStrategies.map(item => ({
  value: item.stageCode,
  label: item.stageName
})))

function approvalTargetOptionsForConfig(config) {
  return approvalTargetNodes(selectedWorkflow.value, config).map(item => ({
    value: item.nodeCode,
    label: `${item.nodeName}（${nodeTypeLabel(item.nodeType)}）`
  }))
}

const routeTargetOptions = computed(() => (selectedWorkflow.value.nodes || [])
  .filter(item => item.nodeCode !== nodeDetailForm.value.nodeCode)
  .map(item => ({
    value: item.nodeCode,
    label: `${item.nodeName}（${nodeTypeLabel(item.nodeType)}）`
  })))

const entrySourceNodeOptions = computed(() => (selectedWorkflow.value.nodes || [])
  .filter(item => item.nodeCode !== nodeDetailForm.value.nodeCode)
  .filter(item => item.nodeType !== 'end')
  .map(item => ({
    value: item.nodeCode,
    label: `${item.nodeName}（${nodeTypeLabel(item.nodeType)}）`
  })))

const outputRouteImpacts = computed(() => outputRouteImpactsForNode(nodeDetailForm.value))

const executorSourceNodeOptions = computed(() => (selectedWorkflow.value.nodes || [])
  .filter(item => item.nodeCode !== nodeDetailForm.value.nodeCode)
  .filter(item => !['end', 'systemTask'].includes(item.nodeType))
  .map(item => ({
    value: item.nodeCode,
    label: `${item.nodeName}（${nodeTypeLabel(item.nodeType)}）`
  })))

const propertyTitle = computed(() => {
  if (selectedElement.value?.type === 'node') return selectedElement.value.data.nodeName
  if (selectedElement.value?.type === 'route') return '流程连线'
  return '流程整体'
})

const flowLayout = computed(() => buildFlowLayout(selectedWorkflow.value.nodes || []))

const flowLayoutStyle = computed(() => ({
  width: `${flowLayout.value.width}px`,
  height: `${flowLayout.value.height}px`
}))

const flowRouteLines = computed(() => buildFlowRouteArtifacts(selectedWorkflow.value, flowLayout.value).lines)

const flowRouteLabels = computed(() => buildFlowRouteArtifacts(selectedWorkflow.value, flowLayout.value).labels)

const validationItems = computed(() => {
  if (routeWarning.value) {
    return [
      { label: '需处理', text: '当前全局策略已变化，需要保存后重新生成节点、路由和执行人规则。', type: 'error' },
      { label: '需确认', text: '存在审批配置或系统节点启停调整，提交发布前应确认影响范围。', type: 'processing' }
    ]
  }
  return [
    { label: '通过', text: '流程包含开始节点和结束节点。', type: 'completed' },
    { label: '通过', text: '所有启用阶段已生成执行人规则或系统处理能力。', type: 'completed' },
    { label: '通过', text: '审批节点与系统节点均来自有效配置。', type: 'completed' }
  ]
})

function createFlow(workflowCode, workflowName, classificationCode, version, status, preset, conditionSummary, nodes, routeLabels = []) {
  const conditionRules = defaultConditionRules(classificationCode, conditionSummary)
  const workTypeCode = classificationWorkType(classificationCode)
  const canonicalSkeleton = Array.isArray(nodes) && nodes.length > 0 ? null : canonicalWorkflowSkeleton(workTypeCode)
  const normalizedNodes = normalizeWorkflowNodes(canonicalSkeleton?.nodes || nodes, workTypeCode)
  const normalizedRouteLabels = canonicalSkeleton?.routeLabels || routeLabels
  const stageStrategies = buildStageStrategies(normalizedNodes, classificationCode)
  const workflow = {
    workflowCode,
    workflowName,
    classificationCode,
    workTypeCode,
    skeletonVersion: skeletonVersionByWorkType(workTypeCode),
    businessObjectType: businessObjectTypeByWorkType(workTypeCode),
    version,
    status: 'draft',
    sourceStatus: status,
    preset,
    publishChecked: 'uncheck',
    conditionSummary: summarizeConditionRules(conditionRules) || conditionSummary,
    conditionRules,
    stageStrategies,
    approvalConfigs: buildApprovalConfigs(normalizedNodes, classificationCode, stageStrategies),
    systemNodeConfigs: buildSystemNodeConfigs(normalizedNodes, workTypeCode, stageStrategies),
    baseNodes: cloneWorkflowNodes(normalizedNodes, workTypeCode),
    nodes: normalizedNodes,
    routes: buildGeneratedRoutes(normalizedNodes, normalizedRouteLabels),
    routeConditionRules: [],
    disabledRouteRules: [],
    statusDefinitions: [],
    statusTransitionRules: null
  }
  normalizeWorkflowStatusSettings(workflow)
  ensureWorkflowDataPermissionSettings(workflow)
  return workflow
}

function normalizeWorkflowNodes(nodes, workTypeCode = '') {
  return nodes.map(item => {
    const actionPolicies = item.actionPolicies || defaultActionPolicies(item.actionSummary)
    return {
      ...item,
      customStage: item.customStage === true,
      customApproval: item.customApproval === true,
      enabled: item.enabled !== false,
      enabledSwitch: item.enabled === false ? 'uncheck' : 'checked',
      approvalFlow: item.approvalFlow || (item.nodeType === 'approvalFlow' ? approvalFlowByWorkType(workTypeCode) : item.approvalFlow),
      systemActionTemplate: item.systemActionTemplate || (item.nodeType === 'systemTask' ? systemActionByWorkType(workTypeCode) : item.systemActionTemplate),
      executorSourceNodeCode: item.executorSourceNodeCode || '',
      executorPerson: item.executorPerson || 'u-zhang-wei',
      actionPolicies,
      actionPolicyApprovalFlows: {
        ...defaultActionPolicyApprovalFlows(actionPolicies),
        ...(item.actionPolicyApprovalFlows || {})
      },
      ...(item.executionPageDataPermissions ? { executionPageDataPermissions: normalizeDataPermissions(item.executionPageDataPermissions, item, { workTypeCode }) } : {}),
      ...(Array.isArray(item.customDataItems) ? { customDataItems: normalizeCustomDataItems(item.customDataItems) } : {}),
      statusOutputOptions: normalizeStatusOutputOptionsForNode(item, item.statusOutputOptions)
    }
  })
}

function cloneWorkflowNodes(nodes, workTypeCode = '') {
  return normalizeWorkflowNodes(nodes, workTypeCode).map(item => ({
    ...item,
    actionPolicies: { ...(item.actionPolicies || {}) },
    ...(item.executionPageDataPermissions ? { executionPageDataPermissions: { ...item.executionPageDataPermissions } } : {}),
    ...(Array.isArray(item.customDataItems) ? { customDataItems: normalizeCustomDataItems(item.customDataItems) } : {}),
    ...(Array.isArray(item.statusOutputOptions) ? { statusOutputOptions: cloneStatusOutputOptions(item.statusOutputOptions) } : {})
  }))
}

function ensureWorkflowDataPermissionSettings(workflow) {
  if (!workflow) return
  if (Array.isArray(workflow.baseNodes)) {
    workflow.baseNodes = workflow.baseNodes.map(item => ensureNodeDataPermissionSettings(item, workflow))
  }
  if (Array.isArray(workflow.nodes)) {
    workflow.nodes = workflow.nodes.map(item => ensureNodeDataPermissionSettings(item, workflow))
  }
}

function ensureNodeDataPermissionSettings(item, workflow) {
  if (!item || !isDataPermissionConfigVisible(item)) return item
  return {
    ...item,
    executionPageDataPermissions: normalizeDataPermissions(item.executionPageDataPermissions, item, workflow)
  }
}

function normalizeDataPermissions(permissions = {}, nodeLike = {}, workflow = null) {
  return dataPermissionGroupsForWorkflow(workflow).reduce((result, group) => {
    const storedValue = permissions?.[group.value]
    result[group.value] = normalizeDataPermissionValue(group, storedValue || defaultDataPermissionValue(nodeLike, group, workflow))
    return result
  }, {})
}

function normalizeDataPermissionValue(group, value) {
  if (!dataPermissionOptions.some(option => option.value === value)) return 'readonly'
  if (group.readonlyOnly && value === 'editable') return 'readonly'
  return value
}

function defaultDataPermissionValue(nodeLike, group, workflow = null) {
  if (group.readonlyOnly) return 'readonly'
  const workTypeCode = dataPermissionWorkType(workflow)
  if (workTypeCode === 'inspection') return defaultInspectionDataPermissionValue(nodeLike, group)
  if (workTypeCode === 'maintenance') return defaultMaintenanceDataPermissionValue(nodeLike, group)
  if (workTypeCode === 'repair') return defaultRepairDataPermissionValue(nodeLike, group)
  if (workTypeCode === 'engineeringChange') return defaultEngineeringChangeDataPermissionValue(nodeLike, group)
  return 'hidden'
}

function dataPermissionWorkType(workflow = null) {
  return workflow?.workTypeCode || classificationWorkType(workflow?.classificationCode || '') || ''
}

function dataPermissionGroupsForWorkflow(workflow = null) {
  return workTypeDataPermissionGroups[dataPermissionWorkType(workflow)] || workOrderDataPermissionGroups
}

function nodePagePolicy(nodeLike = {}) {
  return nodeLike?.pagePolicy || ''
}

function defaultWorkRecordPermissionValue(nodeLike, group, rules) {
  const pagePolicy = nodePagePolicy(nodeLike)
  const type = nodeLike?.nodeType || ''
  const name = nodeLike?.nodeName || ''
  const value = group.value
  const viewOnlyGroups = rules.viewOnlyGroups || []

  if (type === 'approvalFlow') return viewOnlyGroups.includes(value) ? 'readonly' : 'hidden'
  if (type === 'dispatchFlow') return viewOnlyGroups.includes(value) ? 'readonly' : 'hidden'
  if (type === 'businessFlow' || pagePolicy === 'externalPage') {
    if ((rules.externalEditableGroups || rules.executeEditableGroups || []).includes(value)) return 'editable'
    return viewOnlyGroups.includes(value) ? 'readonly' : 'hidden'
  }

  const pageEditableMap = rules.pageEditableMap || {}
  const matchedEditableGroups = pageEditableMap[pagePolicy]
    || (name.includes('验收') || name.includes('复核') ? pageEditableMap.acceptancePage : null)
    || (name.includes('执行') || name.includes('抢修') || name.includes('现场') ? pageEditableMap.executionPage : null)
    || (name.includes('诊断') || name.includes('排查') || name.includes('核实') ? pageEditableMap.diagnosisPage : null)
    || (name.includes('方案') || name.includes('资源') || name.includes('物料') ? pageEditableMap.planPage : null)
    || []

  if (matchedEditableGroups.includes(value)) return 'editable'
  if (viewOnlyGroups.includes(value)) return 'readonly'
  return 'hidden'
}

function defaultInspectionDataPermissionValue(nodeLike, group) {
  return defaultWorkRecordPermissionValue(nodeLike, group, {
    viewOnlyGroups: ['inspectionPlan', 'routeRecords', 'checkInRecords', 'inspectionExecutionRecords', 'problemAndRepairRecords', 'costInfo', 'slaEvaluations'],
    pageEditableMap: {
      inspectionExecutionPage: ['checkInRecords', 'inspectionExecutionRecords', 'problemAndRepairRecords'],
      executionPage: ['checkInRecords', 'inspectionExecutionRecords', 'problemAndRepairRecords']
    }
  })
}

function defaultMaintenanceDataPermissionValue(nodeLike, group) {
  return defaultWorkRecordPermissionValue(nodeLike, group, {
    viewOnlyGroups: ['maintenancePlan', 'checkInRecords', 'maintenanceExecutionRecords', 'maintenanceAcceptance', 'problemAndRepairRecords', 'costInfo', 'slaEvaluations'],
    pageEditableMap: {
      maintenanceExecutionPage: ['checkInRecords', 'maintenanceExecutionRecords', 'problemAndRepairRecords'],
      externalPage: ['checkInRecords', 'maintenanceExecutionRecords', 'problemAndRepairRecords'],
      acceptancePage: ['maintenanceAcceptance'],
      materialPage: ['costInfo'],
      planPage: ['maintenancePlan', 'costInfo'],
      executionPage: ['checkInRecords', 'maintenanceExecutionRecords', 'problemAndRepairRecords']
    },
    externalEditableGroups: ['checkInRecords', 'maintenanceExecutionRecords', 'problemAndRepairRecords']
  })
}

function defaultRepairDataPermissionValue(nodeLike, group) {
  return defaultWorkRecordPermissionValue(nodeLike, group, {
    viewOnlyGroups: ['faultInfo', 'diagnosisRecords', 'repairPlan', 'repairExecutionRecords', 'repairAcceptance', 'costInfo', 'slaEvaluations'],
    pageEditableMap: {
      repairDiagnosisPage: ['faultInfo', 'diagnosisRecords'],
      planPage: ['repairPlan', 'costInfo'],
      materialPage: ['repairPlan', 'costInfo'],
      repairExecutionPage: ['repairExecutionRecords', 'costInfo'],
      externalPage: ['repairExecutionRecords', 'costInfo'],
      acceptancePage: ['repairAcceptance'],
      diagnosisPage: ['faultInfo', 'diagnosisRecords'],
      executionPage: ['repairExecutionRecords', 'costInfo']
    },
    externalEditableGroups: ['repairExecutionRecords', 'costInfo']
  })
}

function defaultEngineeringChangeDataPermissionValue(nodeLike, group) {
  const name = nodeLike?.nodeName || ''
  const type = nodeLike?.nodeType || ''
  const code = nodeLike?.nodeCode || ''
  if (type === 'approvalFlow') {
    if (['changeDemand', 'siteSurveyRecords', 'changePlan', 'costRecords'].includes(group.value)) return 'readonly'
    return 'hidden'
  }
  if (type === 'dispatchFlow') {
    return ['changeDemand', 'siteSurveyRecords', 'changePlan', 'costRecords'].includes(group.value) ? 'readonly' : 'hidden'
  }
  if (name.includes('方案')) {
    if (['changeDemand', 'siteSurveyRecords', 'changePlan', 'costRecords'].includes(group.value)) return 'editable'
    return 'hidden'
  }
  if (name.includes('执行') || name.includes('施工') || code.includes('Execution')) {
    if (group.value === 'executionRecords') return 'editable'
    if (['changeDemand', 'siteSurveyRecords', 'changePlan', 'costRecords'].includes(group.value)) return 'readonly'
    return 'hidden'
  }
  if (name.includes('验收') || name.includes('认证') || code === 'poCompletion') {
    if (group.value === 'acceptanceRecords') return 'editable'
    if (['changeDemand', 'siteSurveyRecords', 'changePlan', 'executionRecords', 'costRecords'].includes(group.value)) return 'readonly'
    return 'hidden'
  }
  if (name.includes('归档') || name.includes('关闭')) {
    if (group.value === 'archiveRecords') return 'editable'
    if (['changeDemand', 'siteSurveyRecords', 'changePlan', 'executionRecords', 'acceptanceRecords', 'costRecords'].includes(group.value)) return 'readonly'
    return 'hidden'
  }
  return 'readonly'
}

function cloneStatusOutputOptions(options = []) {
  if (!Array.isArray(options)) return []
  return options
    .map(item => ({
      value: String(item?.value || '').trim(),
      label: String(item?.label || item?.value || '').trim()
    }))
    .filter(item => item.value && item.label)
}

function normalizeCustomDataItems(items = []) {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => {
    const itemType = customDataItemTypeOptions.some(option => option.value === item?.itemType) ? item.itemType : 'text'
    return {
      id: item?.id || `custom-data-${Date.now()}-${index}`,
      itemName: String(item?.itemName || '').trim(),
      itemType
    }
  })
}

function createCustomDataItem(index = 0) {
  return {
    id: `custom-data-${Date.now()}-${index}`,
    itemName: `自定义记录项${index + 1}`,
    itemType: 'text'
  }
}

function normalizeWorkflowStatusSettings(workflow) {
  const hasStoredStatuses = Array.isArray(workflow.statusDefinitions) && workflow.statusDefinitions.length > 0
  const hasStoredRules = Array.isArray(workflow.statusTransitionRules)
  workflow.statusDefinitions = normalizeWorkflowStatuses(hasStoredStatuses ? workflow.statusDefinitions : defaultWorkflowStatuses(workflow))
  workflow.statusTransitionRules = hasStoredRules
    ? normalizeStatusTransitionRules(workflow, workflow.statusTransitionRules)
    : defaultStatusTransitionRules(workflow)
  ensureStatusTransitionRulesForStatuses(workflow)
}

function normalizeWorkflowStatuses(statuses = []) {
  return statuses
    .map((item, index) => ({
      id: item.id || `status-${Date.now()}-${index}`,
      statusCode: String(item.statusCode || '').trim(),
      statusName: String(item.statusName || '').trim()
    }))
    .filter(item => item.statusCode && item.statusName)
}

function defaultWorkflowStatuses(workflow) {
  const workTypeCode = workflow?.workTypeCode || classificationWorkType(workflow?.classificationCode)
  const base = [
    workflowStatus('new', '新建'),
    workflowStatus('pendingApproval', '待审批'),
    workflowStatus('pendingDispatch', '待分配'),
    workflowStatus('pendingExecution', '待执行'),
    workflowStatus('executing', '执行中'),
    workflowStatus('pendingAcceptance', '待验收'),
    workflowStatus('completed', '已完结')
  ]
  if (workTypeCode !== 'engineeringChange') return base
  if (workflow?.preset === false) {
    return [
      workflowStatus('new', '新建'),
      workflowStatus('planning', '方案制定中'),
      workflowStatus('pendingApproval', '待审批'),
      workflowStatus('pendingDispatch', '待排程派工'),
      workflowStatus('pendingExecution', '待执行'),
      workflowStatus('executing', '执行中'),
      workflowStatus('pendingAcceptance', '待验收'),
      workflowStatus('completed', '已完结')
    ]
  }
  const preset = engineeringWorkflowPreset(workflow?.classificationCode)
  if (preset?.statusCodes?.length) return engineeringWorkflowStatuses(preset.statusCodes)
  return engineeringWorkflowStatuses(['CRTE', 'SBMT', 'SORJ', 'SOSP', 'AORJ', 'AOAP', 'SAPRJ', 'ISSD', 'ACK', 'INPR', 'RTCP', 'RJCP', 'CERT', 'PMCR', 'BHRV', 'FPCP'])
}

function workflowStatus(statusCode, statusName) {
  return {
    id: `status-${statusCode}`,
    statusCode,
    statusName
  }
}

function normalizeStatusTransitionRules(workflow, rules = []) {
  return rules.map((rule, index) => {
    const conditions = Array.isArray(rule.conditions) ? rule.conditions : []
    const targetStatusCode = rule.targetStatusCode || activeWorkflowStatusOptions(workflow)[0]?.value || ''
    const normalizedConditions = conditions.length > 0
      ? conditions.map((condition, conditionIndex) => normalizeStatusRuleCondition(workflow, condition, conditionIndex))
      : [defaultStatusRuleCondition(workflow)]
    return {
      id: rule.id || `status-rule-${Date.now()}-${index}`,
      ruleName: rule.ruleName || `状态规则 ${index + 1}`,
      logicMode: ['all', 'any'].includes(rule.logicMode) ? rule.logicMode : 'all',
      targetStatusId: rule.targetStatusId || '',
      targetStatusCode,
      conditions: normalizeLegacyStatusRuleConditions(workflow, targetStatusCode, normalizedConditions)
    }
  })
}

function normalizeLegacyStatusRuleConditions(workflow, targetStatusCode, conditions = []) {
  if (
    workflow?.workTypeCode === 'engineeringChange'
    && targetStatusCode === 'CERT'
    && (workflow.nodes || []).some(item => item.nodeCode === 'sapPaymentProcess')
    && conditions.length === 1
    && ['poCompletion', 'engineeringAcceptance'].includes(conditions[0]?.nodeCode)
    && conditions[0]?.outputResult === 'completed'
  ) {
    return [{
      ...conditions[0],
      nodeCode: 'sapPaymentProcess',
      outputResult: 'completionCertified'
    }]
  }
  return conditions
}

function normalizeStatusRuleCondition(workflow, condition = {}, index = 0) {
  const fallback = defaultStatusRuleCondition(workflow)
  const nodeCode = condition.nodeCode || fallback.nodeCode
  const outputResult = normalizeLegacyNodeOutputResult(workflow, nodeCode, condition.outputResult || outputOptionsForWorkflowNode(workflow, nodeCode)[0]?.value || 'completed')
  return {
    id: condition.id || `status-condition-${Date.now()}-${index}`,
    nodeCode,
    outputResult
  }
}

function normalizeLegacyNodeOutputResult(workflow, nodeCode, outputResult) {
  if (outputResult === 'workStarted') return 'inProgress'
  return outputResult
}

function defaultStatusRuleCondition(workflow = selectedWorkflow.value) {
  const nodeCode = (workflow?.nodes || []).find(canUseStatusTransitionNode)?.nodeCode || ''
  return {
    id: `status-condition-${Date.now()}`,
    nodeCode,
    outputResult: outputOptionsForWorkflowNode(workflow, nodeCode)[0]?.value || 'completed'
  }
}

function createStatusTransitionRuleForStatus(workflow, status) {
  return {
    id: `status-rule-${status.id || status.statusCode}-${Date.now()}`,
    ruleName: `${status.statusName || status.statusCode}状态流转规则`,
    logicMode: 'all',
    targetStatusId: status.id || '',
    targetStatusCode: status.statusCode || '',
    conditions: [defaultStatusRuleCondition(workflow)]
  }
}

function isStatusRuleForStatus(rule, status) {
  if (!rule || !status) return false
  return (!!rule.targetStatusId && rule.targetStatusId === status.id) || rule.targetStatusCode === status.statusCode
}

function ensureStatusTransitionRulesForStatuses(workflow) {
  if (!workflow) return
  const statuses = workflow.statusDefinitions || []
  const nextRules = []
  ;(workflow.statusTransitionRules || []).forEach(rule => {
    const status = statuses.find(item => isStatusRuleForStatus(rule, item))
    if (!status || nextRules.some(item => item.targetStatusCode === status.statusCode || item.targetStatusId === status.id)) return
    rule.targetStatusId = status.id || ''
    rule.targetStatusCode = status.statusCode
    rule.ruleName = `${status.statusName || status.statusCode}状态流转规则`
    rule.logicMode = ['all', 'any'].includes(rule.logicMode) ? rule.logicMode : 'all'
    rule.conditions = Array.isArray(rule.conditions) && rule.conditions.length > 0
      ? rule.conditions
      : [defaultStatusRuleCondition(workflow)]
    nextRules.push(rule)
  })
  statuses.forEach(status => {
    if (nextRules.some(rule => isStatusRuleForStatus(rule, status))) return
    nextRules.push(createStatusTransitionRuleForStatus(workflow, status))
  })
  workflow.statusTransitionRules = nextRules
}

function defaultStatusTransitionRules(workflow) {
  const nodes = workflow?.nodes || []
  const nodeMap = new Map(nodes.map(item => [item.nodeCode, item]))
  const routes = normalizeRoutes(workflow?.routes || [], nodes)
    .filter(route => !['rejected', 'failed'].includes(route.sourceStatus))
  const statusCodes = new Set(activeWorkflowStatusOptions(workflow).map(item => item.value))
  const rules = []
  routes.forEach(route => {
    const source = nodeMap.get(route.sourceNodeCode)
    const target = nodeMap.get(route.targetNodeCode)
    if (!source || !target || !canUseStatusTransitionNode(source)) return
    const targetStatusCode = defaultTargetStatusForTransition(workflow, source, target, route.sourceStatus)
    if (!targetStatusCode || !statusCodes.has(targetStatusCode)) return
    rules.push({
      id: `status-rule-${route.sourceNodeCode}-${route.sourceStatus}-${targetStatusCode}`,
      ruleName: `${source.nodeName}${outputResultLabel(source, route.sourceStatus)}后${statusNameByCode(workflow, targetStatusCode)}`,
      logicMode: 'all',
      targetStatusCode,
      conditions: [{
        id: `status-condition-${route.sourceNodeCode}-${route.sourceStatus}`,
        nodeCode: route.sourceNodeCode,
        outputResult: route.sourceStatus
      }]
    })
  })
  return normalizeStatusTransitionRules(workflow, rules)
}

function defaultTargetStatusForTransition(workflow, source, target) {
  const targetName = target?.nodeName || ''
  if (target?.nodeType === 'end') return existingWorkflowStatusCode(workflow, 'completed')
  if (target?.nodeType === 'approvalFlow' || targetName.includes('审批')) return existingWorkflowStatusCode(workflow, 'pendingApproval')
  if (target?.nodeType === 'dispatchFlow' || /分配|派工|调度/.test(targetName)) return existingWorkflowStatusCode(workflow, 'pendingDispatch', 'pendingExecution')
  if (/验收|复核|确认|回访/.test(targetName)) return existingWorkflowStatusCode(workflow, 'pendingAcceptance')
  if (/勘察|勘查/.test(targetName)) return existingWorkflowStatusCode(workflow, 'pendingSurvey')
  if (/方案|计划/.test(targetName)) return existingWorkflowStatusCode(workflow, 'planning')
  if (/资源|准备|就绪/.test(targetName)) return existingWorkflowStatusCode(workflow, 'preparing')
  if (/归档|台账/.test(targetName)) return existingWorkflowStatusCode(workflow, 'pendingArchive')
  if (/执行|施工|维修|巡检|维保|外委|协同/.test(targetName)) return existingWorkflowStatusCode(workflow, 'pendingExecution', 'executing')
  return existingWorkflowStatusCode(workflow, 'pendingExecution', 'executing')
}

function existingWorkflowStatusCode(workflow, ...candidates) {
  const options = activeWorkflowStatusOptions(workflow)
  return candidates.find(code => options.some(item => item.value === code)) || options[0]?.value || ''
}

function activeWorkflowStatusOptions(workflow = selectedWorkflow.value) {
  return (workflow?.statusDefinitions || [])
    .map(item => ({
      value: item.statusCode,
      label: item.statusName
    }))
}

function canUseStatusTransitionNode(item) {
  return !!item && item.enabled !== false
}

function addWorkflowStatus() {
  const workflow = selectedWorkflow.value
  const index = (workflow.statusDefinitions || []).length + 1
  workflow.statusDefinitions.push({
    id: `status-custom-${Date.now()}`,
    statusCode: `customStatus${index}`,
    statusName: `自定义状态${index}`
  })
  ensureStatusTransitionRulesForStatuses(workflow)
  markStrategyDirty()
}

function removeWorkflowStatus(status) {
  const workflow = selectedWorkflow.value
  if ((workflow.statusDefinitions || []).length <= 1) {
    showToast('至少需要保留一个单据状态。')
    return
  }
  workflow.statusDefinitions = workflow.statusDefinitions.filter(item => item.id !== status.id)
  workflow.statusTransitionRules = (workflow.statusTransitionRules || []).filter(rule => !isStatusRuleForStatus(rule, status))
  ensureStatusTransitionRulesForStatuses(workflow)
  markStrategyDirty()
}

function changeWorkflowStatusDefinition() {
  ensureStatusTransitionRulesForStatuses(selectedWorkflow.value)
  markStrategyDirty()
}

function addStatusRuleCondition(rule) {
  rule.conditions.push(defaultStatusRuleCondition(selectedWorkflow.value))
  markStrategyDirty()
}

function removeStatusRuleCondition(rule, conditionIndex) {
  if (rule.conditions.length <= 1) {
    showToast('每条状态流转规则至少需要一个节点输出条件。')
    return
  }
  rule.conditions.splice(conditionIndex, 1)
  markStrategyDirty()
}

function changeStatusRuleConditionNode(condition) {
  condition.outputResult = outputOptionsForNodeCode(condition.nodeCode)[0]?.value || 'completed'
  markStrategyDirty()
}

function outputOptionsForNodeCode(nodeCode) {
  return outputOptionsForWorkflowNode(selectedWorkflow.value, nodeCode)
}

function outputOptionsForWorkflowNode(workflow, nodeCode) {
  const nodeItem = (workflow?.nodes || []).find(item => item.nodeCode === nodeCode)
  return outputStatusOptionsByNode(nodeItem)
}

function statusTransitionRuleText(rule, status) {
  const relation = rule.logicMode === 'any' ? ' 或 ' : ' 且 '
  const conditionText = (rule.conditions || []).map(statusRuleConditionText).join(relation) || '未配置条件'
  return `流程状态「${status?.statusName || statusNameByCode(selectedWorkflow.value, rule.targetStatusCode)}」：${conditionText}`
}

function statusRuleConditionText(condition) {
  const nodeItem = (selectedWorkflow.value.nodes || []).find(item => item.nodeCode === condition.nodeCode)
  return `${nodeItem?.nodeName || '未选择节点'} + ${outputResultLabel(nodeItem, condition.outputResult)}`
}

function statusNameByCode(workflow, statusCode) {
  return (workflow?.statusDefinitions || []).find(item => item.statusCode === statusCode)?.statusName || statusCode || '未配置状态'
}

function ensureBaseNodes(workflow) {
  if (!Array.isArray(workflow.baseNodes)) {
    workflow.baseNodes = cloneWorkflowNodes(workflow.nodes || [], workflow.workTypeCode)
  }
  return workflow.baseNodes
}

function node(nodeCode, nodeName, nodeType, extra = {}) {
  const actionPolicies = extra.actionPolicies || defaultActionPolicies(extra.actionSummary || '')
  return {
    nodeCode,
    nodeName,
    nodeType,
    enabled: true,
    enabledSwitch: 'checked',
    actionSummary: '',
    actionPolicies,
    actionPolicyApprovalFlows: defaultActionPolicyApprovalFlows(actionPolicies),
    executorSource: 'inheritDispatch',
    executorSourceNodeCode: '',
    executorPerson: 'u-zhang-wei',
    fallbackExecutor: 'engineeringSupervisor',
    slaPolicy: 'sla-normal-24h',
    ...extra
  }
}

function selectWorkflow(workflow) {
  const tenantAoRepaired = ensureTenantAoApprovalRepair(workflow)
  const capitalDispatchRepaired = ensureCapitalDispatchConfigRepair(workflow)
  if (tenantAoRepaired || capitalDispatchRepaired) {
    rebuildWorkflowByStrategies(workflow)
    normalizeWorkflowStatusSettings(workflow)
    persistWorkflows()
  }
  const baseNodes = ensureBaseNodes(workflow)
  if (!Array.isArray(workflow.stageStrategies)) {
    workflow.stageStrategies = buildStageStrategies(baseNodes, workflow.classificationCode)
  }
  applyStageLockRules(workflow)
  normalizeStageAssignmentStrategies(workflow)
  normalizeWorkflowStatusSettings(workflow)
  if (!Array.isArray(workflow.approvalConfigs)) {
    workflow.approvalConfigs = buildApprovalConfigs(baseNodes, workflow.classificationCode, workflow.stageStrategies)
  }
  if (!Array.isArray(workflow.systemNodeConfigs)) {
    workflow.systemNodeConfigs = buildSystemNodeConfigs(baseNodes, workflow.workTypeCode, workflow.stageStrategies)
  }
  selectedWorkflow.value = workflow
  selectWholeWorkflow()
  closeNodeDetail()
  strategyDirty.value = false
  canvasNotice.value = ''
}

function selectWholeWorkflow() {
  selectedElement.value = { type: 'workflow', id: selectedWorkflow.value.workflowCode, data: selectedWorkflow.value }
}

function openNodeDetail(item) {
  if (canvasDragState.value.didDrag) return
  item.enabledSwitch = item.enabled ? 'checked' : 'uncheck'
  selectedElement.value = { type: 'node', id: item.nodeCode, data: item }
  selectedNode.value = item
  nodeDetailForm.value = createNodeDetail(item)
  activeNodeDetailTab.value = 'basic'
  nodeDetailVisible.value = true
}

function closeNodeDetail() {
  nodeDetailVisible.value = false
  selectedNode.value = null
  selectWholeWorkflow()
}

function createNewWorkflowForm() {
  return {
    classificationCode: '',
    workTypeCode: '',
    workflowName: '',
    conditionRules: []
  }
}

function createDraftWorkflowCode() {
  const existingCodes = new Set(workflows.value.map(item => item.workflowCode))
  const baseCode = `WF-DRAFT-${Date.now()}`
  let workflowCode = baseCode
  let index = 1
  while (existingCodes.has(workflowCode)) {
    index += 1
    workflowCode = `${baseCode}-${index}`
  }
  return workflowCode
}

function openCreateWorkflowModal() {
  createWorkflowForm.value = createNewWorkflowForm()
  createWorkflowVisible.value = true
}

function changeCreateWorkflowWorkType() {
  createWorkflowForm.value.classificationCode = ''
  createWorkflowForm.value.conditionRules = []
}

function confirmCreateWorkflow() {
  const fallbackWorkTypeCode = createWorkflowForm.value.workTypeCode
  if (!fallbackWorkTypeCode) {
    showToast('请先选择工作类型。')
    return
  }
  if (!createWorkflowForm.value.workflowName) {
    showToast('请输入流程名称。')
    return
  }
  const fallbackClassificationCode = createWorkflowForm.value.classificationCode || defaultClassificationForWorkType(fallbackWorkTypeCode)
  const classificationCode = extractClassificationCode(createWorkflowForm.value.conditionRules, fallbackClassificationCode)
  const workTypeCode = createWorkflowForm.value.conditionRules.length === 0 ? fallbackWorkTypeCode : classificationWorkType(classificationCode)
  const workflowName = createWorkflowForm.value.workflowName
  const workflow = createFlow(
    createDraftWorkflowCode(),
    workflowName,
    classificationCode,
    '0.1-draft',
    'draft',
    false,
    summarizeConditionRules(createWorkflowForm.value.conditionRules),
    defaultNodesForWorkType(workTypeCode),
    defaultRouteLabelsForWorkType(workTypeCode)
  )
  const defaultRoutes = defaultRoutesForWorkType(workTypeCode)
  if (defaultRoutes.length > 0) applyWorkflowRoutes(workflow, defaultRoutes)
  workflow.conditionRules = cloneConditionRules(createWorkflowForm.value.conditionRules)
  workflow.conditionSummary = conditionText(workflow)
  workflows.value.unshift(workflow)
  selectWorkflow(workflow)
  createWorkflowVisible.value = false
  persistWorkflows()
  saveMessage.value = '新建流程草稿已创建，可继续配置适用条件、业务节点、审批节点和系统节点。'
  showToast(saveMessage.value)
}

function requestDeleteWorkflow(workflow) {
  if (workflows.value.length <= 1) {
    showToast('至少需要保留一个工作流程。')
    return
  }
  workflowPendingDelete.value = workflow
  deleteWorkflowVisible.value = true
}

function cancelDeleteWorkflow() {
  deleteWorkflowVisible.value = false
  workflowPendingDelete.value = null
}

function confirmDeleteWorkflow() {
  const workflow = workflowPendingDelete.value
  if (!workflow) return
  const deleteIndex = workflows.value.findIndex(item => item.workflowCode === workflow.workflowCode)
  if (deleteIndex === -1) {
    cancelDeleteWorkflow()
    return
  }
  const deletingSelected = selectedWorkflow.value.workflowCode === workflow.workflowCode
  workflows.value.splice(deleteIndex, 1)
  if (deletingSelected) {
    const nextWorkflow = workflows.value[Math.min(deleteIndex, workflows.value.length - 1)]
    if (nextWorkflow) selectWorkflow(nextWorkflow)
  }
  cancelDeleteWorkflow()
  persistWorkflows()
  showToast('工作流程已删除。')
}

function addNode() {
  const workflow = selectedWorkflow.value
  const targetNode = defaultStageInsertTargetNode(workflow)
  const newNodeCode = `customStage${Date.now()}`
  const newStage = {
    id: `stage-${stageSeq++}`,
    stageCode: newNodeCode,
    stageName: '新增工作阶段',
    stageTemplate: 'execute',
    core: false,
    required: false,
    canDisable: true,
    enabledSwitch: 'checked',
    assignmentEnabledSwitch: 'uncheck',
    assignmentMode: 'system',
    assignmentTargetType: 'role',
    assignmentTarget: 'operationDispatcher',
    customStage: true,
    targetStageCode: targetNode?.nodeCode || '',
    position: 'after'
  }
  workflow.stageStrategies.push(newStage)
  syncCustomStagePlacement(workflow, newStage)
  syncWorkflowAfterNodeConfigChange('工作阶段节点已添加，流程图已同步生成。')
}

function defaultStageInsertTargetNode(workflow, stage = null) {
  const baseNodes = ensureBaseNodes(workflow)
  const stageCode = stage?.stageCode || ''
  const position = stage?.position || 'after'
  return [...baseNodes].reverse().find(item => item.nodeCode !== stageCode && isValidStageInsertTarget(item, position))
    || baseNodes.find(item => item.nodeCode !== stageCode)
    || null
}

function stageInsertTargetOptions(stage) {
  return ensureBaseNodes(selectedWorkflow.value)
    .filter(item => item.nodeCode !== stage?.stageCode)
    .filter(item => isValidStageInsertTarget(item, stage?.position || 'after'))
    .map(item => ({
      value: item.nodeCode,
      label: `${item.nodeName}（${nodeTypeLabel(item.nodeType)}）`
    }))
}

function isValidStageInsertTarget(item, position) {
  if (!item) return false
  if (position === 'before' && item.nodeType === 'start') return false
  if (position === 'after' && item.nodeType === 'end') return false
  return true
}

function isCustomStageStrategy(stage) {
  return stage?.customStage === true
}

function changeCustomStageName(stage) {
  const baseNode = ensureBaseNodes(selectedWorkflow.value).find(item => item.nodeCode === stage.stageCode)
  if (baseNode) baseNode.nodeName = stage.stageName
  const generatedNode = (selectedWorkflow.value.nodes || []).find(item => item.nodeCode === stage.stageCode)
  if (generatedNode) generatedNode.nodeName = stage.stageName
  syncWorkflowAfterNodeConfigChange('工作阶段节点名称已更新，流程图已同步重算。')
}

function changeCustomStageInsertRule(stage) {
  syncCustomStagePlacement(selectedWorkflow.value, stage)
  syncWorkflowAfterNodeConfigChange('工作阶段插入位置已更新，流程图已同步重算。')
}

function syncAllCustomStagePlacements(workflow) {
  ;(workflow.stageStrategies || [])
    .filter(isCustomStageStrategy)
    .forEach(stage => syncCustomStagePlacement(workflow, stage))
}

function syncCustomStagePlacement(workflow, stage) {
  if (!workflow || !isCustomStageStrategy(stage)) return
  const baseNodes = ensureBaseNodes(workflow)
  const fallbackTarget = defaultStageInsertTargetNode(workflow, stage)
  const selectedTarget = baseNodes.find(item => item.nodeCode === stage.targetStageCode)
  if (!stage.targetStageCode || stage.targetStageCode === stage.stageCode || !isValidStageInsertTarget(selectedTarget, stage.position || 'after')) {
    stage.targetStageCode = fallbackTarget?.nodeCode || ''
  }
  stage.position = stage.position || 'after'

  const existingNode = baseNodes.find(item => item.nodeCode === stage.stageCode)
  const nextNode = existingNode || node(stage.stageCode, stage.stageName || '新增工作阶段', 'workStage')
  Object.assign(nextNode, {
    nodeCode: stage.stageCode,
    nodeName: stage.stageName || '新增工作阶段',
    nodeType: 'workStage',
    customStage: true,
    targetStageCode: stage.targetStageCode,
    position: stage.position,
    stageTemplate: stage.stageTemplate || 'execute',
    executionMode: nextNode.executionMode || 'singleExecutor',
    pagePolicy: nextNode.pagePolicy || 'repairExecutionPage',
    executorSource: nextNode.executorSource || 'inheritDispatch',
    executorSourceNodeCode: nextNode.executorSourceNodeCode || '',
    fallbackExecutor: nextNode.fallbackExecutor || 'engineeringSupervisor',
    assignmentEnabledSwitch: stage.assignmentEnabledSwitch || nextNode.assignmentEnabledSwitch || 'uncheck',
    assignmentMode: stage.assignmentMode || nextNode.assignmentMode || 'system',
    assignmentTargetType: stage.assignmentTargetType || nextNode.assignmentTargetType || 'role',
    assignmentTarget: stage.assignmentTarget || nextNode.assignmentTarget || 'operationDispatcher',
    dispatchExecutorSource: stage.dispatchExecutorSource || nextNode.dispatchExecutorSource || 'fixedRole',
    dispatchFallbackExecutor: stage.dispatchFallbackExecutor || nextNode.dispatchFallbackExecutor || 'operationDispatcher',
    dispatchExecutorPerson: stage.dispatchExecutorPerson || nextNode.dispatchExecutorPerson || 'u-zhang-wei',
    dispatchActionPolicies: stage.dispatchActionPolicies || nextNode.dispatchActionPolicies || { ...blankActionPolicies },
    dispatchActionPolicyApprovalFlows: stage.dispatchActionPolicyApprovalFlows || nextNode.dispatchActionPolicyApprovalFlows || { ...blankActionPolicyApprovalFlows },
    actionSummary: nextNode.actionSummary || '按自定义阶段要求记录现场信息并提交处理结果。',
    customDataItems: normalizeCustomDataItems(nextNode.customDataItems || []),
    statusOutputOptions: normalizeStatusOutputOptionsForNode(nextNode, nextNode.statusOutputOptions)
  })

  const remainingNodes = baseNodes.filter(item => item.nodeCode !== stage.stageCode)
  const targetIndex = remainingNodes.findIndex(item => item.nodeCode === stage.targetStageCode)
  const fallbackIndex = Math.max(remainingNodes.length - 1, 1)
  let insertIndex = targetIndex >= 0
    ? (stage.position === 'before' ? targetIndex : targetIndex + 1)
    : fallbackIndex
  insertIndex = Math.max(1, Math.min(insertIndex, Math.max(remainingNodes.length - 1, 1)))
  baseNodes.splice(0, baseNodes.length, ...remainingNodes.slice(0, insertIndex), nextNode, ...remainingNodes.slice(insertIndex))
  orderStageStrategiesByBaseNodes(workflow)
}

function orderStageStrategiesByBaseNodes(workflow) {
  const stageMap = new Map((workflow.stageStrategies || []).map(stage => [stage.stageCode, stage]))
  const ordered = ensureBaseNodes(workflow)
    .filter(item => stageMap.has(item.nodeCode))
    .map(item => stageMap.get(item.nodeCode))
  const missing = (workflow.stageStrategies || []).filter(stage => !ordered.includes(stage))
  workflow.stageStrategies = [...ordered, ...missing]
}

function removeStageNode(stage) {
  if (!stage) {
    return
  }
  if (!isCustomStageStrategy(stage)) {
    showToast('预置节点不可删除，可通过停用控制是否参与流程。')
    return
  }
  const workflow = selectedWorkflow.value
  const stageCode = stage.stageCode
  const isStageRelated = code => code === stageCode || scheduleOwnerStageCode(code) === stageCode
  const baseNodes = ensureBaseNodes(workflow)
  const baseIndex = baseNodes.findIndex(item => item.nodeCode === stageCode)
  if (baseIndex >= 0) baseNodes.splice(baseIndex, 1)
  workflow.stageStrategies = (workflow.stageStrategies || []).filter(item => item.stageCode !== stageCode)
  workflow.approvalConfigs = (workflow.approvalConfigs || []).filter(item => item.targetStageCode !== stageCode)
  workflow.systemNodeConfigs = (workflow.systemNodeConfigs || []).filter(item => item.targetStageCode !== stageCode)
  workflow.routes = (workflow.routes || []).filter(route => !isStageRelated(route.sourceNodeCode) && !isStageRelated(route.targetNodeCode))
  workflow.routeConditionRules = (workflow.routeConditionRules || []).filter(rule => !isStageRelated(rule.sourceNodeCode) && !isStageRelated(rule.targetNodeCode))
  workflow.disabledRouteRules = (workflow.disabledRouteRules || []).filter(rule => !isStageRelated(rule.sourceNodeCode) && !isStageRelated(rule.targetNodeCode))
  if (selectedElement.value?.type === 'node' && isStageRelated(selectedElement.value.id)) closeNodeDetail()
  rebuildWorkflowByStrategies(workflow)
  markStrategyDirty()
  persistWorkflows()
  showToast('工作阶段节点已删除，流程图已自动更新。')
}

function saveWorkflow() {
  selectedWorkflow.value.conditionSummary = conditionText(selectedWorkflow.value)
  persistWorkflows()
  saveMessage.value = '流程配置草稿已保存，后续可继续编辑全局策略和节点详情。'
  showToast(saveMessage.value)
}

function toggleRouteWarning() {
  routeWarning.value = !routeWarning.value
  canvasNotice.value = routeWarning.value ? '校验发现策略待刷新或影响范围待确认，请保存全局策略后再次校验。' : ''
}

function markStrategyDirty() {
  strategyDirty.value = true
  routeWarning.value = true
  canvasNotice.value = '业务配置已变更，保存后将自动重算流程图。'
}

function changeWorkflowName(event) {
  const nextName = event?.target?.value
  if (typeof nextName === 'string') selectedWorkflow.value.workflowName = nextName
  markStrategyDirty()
  persistWorkflows()
}

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
  }, 2600)
}

function changeStageEnabled(stage) {
  if (!stage) return
  syncWorkflowAfterNodeConfigChange('节点启停状态已更新，流程图已同步重算。')
}

function openStageNodeDetail(stage) {
  if (stage.enabledSwitch !== 'checked') return
  if (isCustomStageStrategy(stage)) {
    syncCustomStagePlacement(selectedWorkflow.value, stage)
    rebuildWorkflowByStrategies(selectedWorkflow.value)
  }
  const nodeItem = (selectedWorkflow.value.nodes || []).find(item => item.nodeCode === stage.stageCode)
  if (!nodeItem) {
    showToast('请先保存节点配置后再编辑节点详情。')
    return
  }
  openNodeDetail(nodeItem)
}

function openApprovalNodeDetail(config) {
  if (config.enabledSwitch !== 'checked') return
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  const nodeItem = (selectedWorkflow.value.nodes || []).find(item => item.approvalConfigId === config.id)
  if (!nodeItem) {
    showToast('审批节点未生成，请确认挂接节点后再查看详情。')
    return
  }
  openNodeDetail(nodeItem)
}

function openSystemNodeDetail(config) {
  if (config.enabledSwitch !== 'checked') return
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  const nodeItem = (selectedWorkflow.value.nodes || []).find(item => item.systemConfigId === config.id)
  if (!nodeItem) {
    showToast('系统节点未生成，请确认挂接节点后再查看详情。')
    return
  }
  openNodeDetail(nodeItem)
}

function changeStageAssignmentEnabled(stage) {
  if (stage.assignmentEnabledSwitch === 'checked') {
    stage.assignmentMode = stage.assignmentMode || 'system'
    if (stage.assignmentMode === 'manual') ensureStageAssignmentTarget(stage)
  }
  markStrategyDirty()
}

function changeStageAssignmentMode(stage) {
  stage.assignmentEnabledSwitch = 'checked'
  if (stage.assignmentMode === 'manual') ensureStageAssignmentTarget(stage)
  markStrategyDirty()
}

function changeStageAssignmentTargetType(stage) {
  const options = assignmentTargetOptions(stage)
  stage.assignmentTarget = options[0]?.value || ''
  markStrategyDirty()
}

function changeNodeAssignmentEnabled() {
  if (nodeDetailForm.value.assignmentEnabledSwitch === 'checked') {
    nodeDetailForm.value.assignmentMode = nodeDetailForm.value.assignmentMode || 'system'
    nodeDetailForm.value.executorSource = 'inheritDispatch'
    nodeDetailForm.value.executorSourceNodeCode = ''
  } else if (nodeDetailForm.value.executorSource === 'inheritDispatch') {
    nodeDetailForm.value.executorSource = 'creator'
  }
}

function changeNodeAssignmentMode() {
  nodeDetailForm.value.assignmentEnabledSwitch = 'checked'
  nodeDetailForm.value.executorSource = 'inheritDispatch'
  nodeDetailForm.value.executorSourceNodeCode = ''
}

function selectNodeAssignmentMode(mode) {
  nodeDetailForm.value.assignmentEnabledSwitch = 'checked'
  nodeDetailForm.value.assignmentMode = mode
  nodeDetailForm.value.executorSource = 'inheritDispatch'
  nodeDetailForm.value.executorSourceNodeCode = ''
}

function changeNodeAssignmentTargetType() {
  const options = assignmentTargetOptions(nodeDetailForm.value)
  nodeDetailForm.value.assignmentTarget = options[0]?.value || ''
}

function ensureStageAssignmentTarget(stage) {
  stage.assignmentTargetType = stage.assignmentTargetType || 'role'
  if (!stage.assignmentTarget) {
    stage.assignmentTarget = assignmentTargetOptions(stage)[0]?.value || ''
  }
}

function assignmentTargetOptions(stage) {
  return stage.assignmentTargetType === 'person' ? assignmentPersonOptions : assignmentRoleOptions
}

function applyWorkflowFilter() {
  canvasNotice.value = '已按筛选条件刷新工作流程列表。'
}

function resetWorkflowFilter() {
  workflowFilter.value = {
    classification: ''
  }
  workflowKeyword.value = ''
  canvasNotice.value = '已重置筛选条件。'
}

function validateAllWorkflows() {
  routeWarning.value = false
  canvasNotice.value = '已完成全部流程样例校验，未发现阻断项。'
}

function openValidationModal() {
  const issues = validateWorkflow(selectedWorkflow.value)
  validationIssues.value = issues
  validationCheckedAt.value = formatValidationTime()
  validationVisible.value = true
  routeWarning.value = issues.some(issue => issue.severity === 'error')
  canvasNotice.value = issues.length === 0 ? '流程校验通过，未发现阻断项。' : `流程校验发现 ${issues.length} 项需要处理。`
}

function validateWorkflow(workflow) {
  const issues = []
  const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : []
  const enabledNodes = nodes.filter(item => item.enabled !== false)
  const enabledNodeMap = new Map(enabledNodes.map(item => [item.nodeCode, item]))
  const routes = Array.isArray(workflow?.routes) ? workflow.routes.map(route => normalizeRoute(route, nodes)) : []
  const validRoutes = routes.filter(route => enabledNodeMap.has(route.sourceNodeCode) && enabledNodeMap.has(route.targetNodeCode))

  validateWorkflowBasics(workflow, nodes, enabledNodes, issues)
  validateNodeConnectivity(enabledNodes, validRoutes, issues)
  validateRouteRules(workflow, nodes, enabledNodeMap, routes, issues)
  validateStageStrategies(workflow, enabledNodeMap, issues)
  validateNodeExecutionRules(enabledNodes, validRoutes, issues)
  validateApprovalConfigs(workflow, issues)
  validateSystemNodeConfigs(workflow, issues)
  validateStatusTransitionConfig(workflow, nodes, issues)

  return issues
}

function validateWorkflowBasics(workflow, nodes, enabledNodes, issues) {
  if (!String(workflow?.workflowName || '').trim()) {
    addValidationIssue(issues, {
      severity: 'error',
      title: '流程名称不能为空',
      location: '流程基础信息',
      description: '流程名称用于列表、画布标题和发布版本识别，提交发布前必须填写。',
      targetType: 'workflow'
    })
  }
  if (!workflow?.workTypeCode) {
    addValidationIssue(issues, {
      severity: 'error',
      title: '工作类型不能为空',
      location: '流程基础信息',
      description: '流程必须归属一个基础工作类型，否则无法带出节点模板、SLA 和系统节点默认值。',
      targetType: 'workflow'
    })
  }
  if (!workflow?.classificationCode && (!Array.isArray(workflow?.conditionRules) || workflow.conditionRules.length === 0)) {
    addValidationIssue(issues, {
      severity: 'warning',
      title: '未明确工作分类条件',
      location: '适用条件',
      description: '当前流程会作为该工作类型的默认流程。若不是默认流程，请补充工作分类或其他适用条件。',
      targetType: 'workflow'
    })
  }

  const codeCount = new Map()
  nodes.forEach(item => {
    if (!item.nodeCode) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '存在节点缺少编码',
        location: item.nodeName || '未命名节点',
        description: '节点编码是路由、执行人规则和节点详情的引用键，不能为空。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
      return
    }
    codeCount.set(item.nodeCode, (codeCount.get(item.nodeCode) || 0) + 1)
    if (!String(item.nodeName || '').trim()) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '节点名称不能为空',
        location: item.nodeCode,
        description: '节点名称会展示在流程图、待办和流程轨迹中，不能为空。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
  })
  codeCount.forEach((count, nodeCode) => {
    if (count <= 1) return
    addValidationIssue(issues, {
      severity: 'error',
      title: '节点编码重复',
      location: nodeCode,
      description: '同一流程内节点编码必须唯一，否则路由和执行记录无法准确归属。',
      targetType: 'node',
      targetCode: nodeCode
    })
  })

  const startNodes = enabledNodes.filter(item => item.nodeType === 'start')
  const endNodes = enabledNodes.filter(item => item.nodeType === 'end')
  if (startNodes.length !== 1) {
    addValidationIssue(issues, {
      severity: 'error',
      title: startNodes.length === 0 ? '缺少开始节点' : '开始节点数量异常',
      location: '流程图',
      description: '一个可发布流程必须且只能有一个启用的开始节点。',
      targetType: 'workflow'
    })
  }
  if (endNodes.length === 0) {
    addValidationIssue(issues, {
      severity: 'error',
      title: '缺少结束节点',
      location: '流程图',
      description: '流程必须至少有一个启用的结束节点，用于承接正常完成、终止或关闭路径。',
      targetType: 'workflow'
    })
  }
}

function validateNodeConnectivity(enabledNodes, validRoutes, issues) {
  const incomingMap = buildRouteMap(validRoutes, 'targetNodeCode')
  const outgoingMap = buildRouteMap(validRoutes, 'sourceNodeCode')
  enabledNodes.forEach(item => {
    const incoming = incomingMap.get(item.nodeCode) || []
    const outgoing = outgoingMap.get(item.nodeCode) || []
    if (item.nodeType !== 'start' && incoming.length === 0) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '启用节点缺少进入路由',
        location: item.nodeName,
        description: '除开始节点外，启用节点必须有至少一条进入路由，否则运行时不会生成该节点任务。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
    if (item.nodeType !== 'end' && outgoing.length === 0) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '启用节点缺少输出路由',
        location: item.nodeName,
        description: '非终态节点必须有输出路由，否则流程会停在该节点无法继续。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
    if (item.nodeType === 'end' && outgoing.length > 0) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '结束节点不应存在输出路由',
        location: item.nodeName,
        description: '结束节点代表流程终态，不能继续流向其他节点。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
  })

  const startNodes = enabledNodes.filter(item => item.nodeType === 'start')
  const endNodes = enabledNodes.filter(item => item.nodeType === 'end')
  const reachableFromStart = collectReachableNodes(startNodes.map(item => item.nodeCode), validRoutes, 'forward')
  const reachableToEnd = collectReachableNodes(endNodes.map(item => item.nodeCode), validRoutes, 'reverse')
  enabledNodes.forEach(item => {
    if (!reachableFromStart.has(item.nodeCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '节点无法从开始节点到达',
        location: item.nodeName,
        description: '该节点不在开始节点可达路径内，请检查它的进入路由。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
    if (!reachableToEnd.has(item.nodeCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '节点无法到达结束节点',
        location: item.nodeName,
        description: '该节点无法最终到达结束节点，请补充输出路由或终态路径。',
        targetType: 'node',
        targetCode: item.nodeCode
      })
    }
  })

  const cyclicNodeCode = findNonRejectCycle(enabledNodes, validRoutes)
  if (cyclicNodeCode) {
    const nodeItem = enabledNodes.find(item => item.nodeCode === cyclicNodeCode)
    addValidationIssue(issues, {
      severity: 'warning',
      title: '存在非驳回环路',
      location: nodeItem?.nodeName || cyclicNodeCode,
      description: '流程存在可能循环流转的路径。若这是复核退回以外的业务循环，请确认是否需要退出条件。',
      targetType: 'node',
      targetCode: cyclicNodeCode
    })
  }
}

function validateRouteRules(workflow, nodes, enabledNodeMap, routes, issues) {
  const allNodeMap = new Map(nodes.map(item => [item.nodeCode, item]))
  const validConditionFields = new Set(routeConditionFieldOptions.map(item => item.value))
  const routePriorityMap = new Map()
  const routeKeyMap = new Map()
  routes.forEach(route => {
    const source = allNodeMap.get(route.sourceNodeCode)
    const target = allNodeMap.get(route.targetNodeCode)
    if (!source || !target) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '路由端点不存在',
        location: `${nodeName(route.sourceNodeCode)} -> ${nodeName(route.targetNodeCode)}`,
        description: '路由的来源节点和目标节点必须都存在，请删除无效路由或重新选择节点。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
      return
    }
    if (!enabledNodeMap.has(route.sourceNodeCode) || !enabledNodeMap.has(route.targetNodeCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '路由连接了停用节点',
        location: `${source.nodeName} -> ${target.nodeName}`,
        description: '发布版本中不能保留指向停用节点的有效路由，请启用节点或调整路由。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
    }
    if (source.nodeType === 'end') {
      addValidationIssue(issues, {
        severity: 'error',
        title: '结束节点存在输出路由',
        location: `${source.nodeName} -> ${target.nodeName}`,
        description: '结束节点不能作为路由来源，请删除该连线。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
    }

    const sourceStatus = normalizedRouteSourceStatus(route, nodes, source)
    const allowedSourceStatuses = new Set(outputStatusOptionsByNode(source).map(item => item.value))
    if (!allowedSourceStatuses.has(sourceStatus)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '路由输出结果无效',
        location: `${source.nodeName} -> ${target.nodeName}`,
        description: '路由使用的输出结果必须来自来源节点的“执行结果配置”。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
    }

    const routeKey = routeConditionRuleKey({ ...route, sourceStatus })
    if (routeKeyMap.has(routeKey)) {
      addValidationIssue(issues, {
        severity: 'warning',
        title: '存在重复路由',
        location: `${source.nodeName} -> ${target.nodeName}`,
        description: '相同来源节点、目标节点和输出结果的路由重复出现，建议合并条件，避免运行时判断冗余。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
    } else {
      routeKeyMap.set(routeKey, route)
    }

    const priorityKey = `${route.sourceNodeCode}:${route.priority || ''}`
    if (route.priority && routePriorityMap.has(priorityKey)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '同来源路由优先级重复',
        location: source.nodeName,
        description: '同一来源节点下多条路由的优先级不能重复，否则运行时无法稳定排序。',
        targetType: 'route',
        sourceNodeCode: route.sourceNodeCode,
        targetCode: route.targetNodeCode
      })
    } else if (route.priority) {
      routePriorityMap.set(priorityKey, route)
    }

    ;(route.extraConditions || []).forEach(condition => {
      if (typeof condition === 'string') return
      if (!isConditionRuleComplete(condition)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '路由条件未填写完整',
          location: `${source.nodeName} -> ${target.nodeName}`,
          description: '路由条件必须完整配置字段、运算符和值。',
          targetType: 'route',
          sourceNodeCode: route.sourceNodeCode,
          targetCode: route.targetNodeCode
        })
      } else if (!validConditionFields.has(condition.field)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '路由条件引用了不可用字段',
          location: `${source.nodeName} -> ${target.nodeName}`,
          description: '条件字段必须来自当前工作类型可用于流程判断的字段集合。',
          targetType: 'route',
          sourceNodeCode: route.sourceNodeCode,
          targetCode: route.targetNodeCode
        })
      }
    })
  })

  // 当前路由由“目标节点进入条件”统一维护，同一来源节点允许进入多个目标节点，
  // 用于表达并行分流、条件分流或合流入口；不能再按旧的出向路由兜底规则报错。
}

function validateStageStrategies(workflow, enabledNodeMap, issues) {
  const baseNodeMap = new Map(ensureBaseNodes(workflow).map(item => [item.nodeCode, item]))
  ;(workflow.stageStrategies || []).forEach(stage => {
    if (stage.enabledSwitch !== 'checked') return
    const stageInsertTarget = baseNodeMap.get(stage.targetStageCode)
    if (isCustomStageStrategy(stage) && (!stage.targetStageCode || stage.targetStageCode === stage.stageCode || !isValidStageInsertTarget(stageInsertTarget, stage.position || 'after'))) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '自定义工作阶段插入位置无效',
        location: stage.stageName || '新增工作阶段',
        description: '自定义工作阶段必须选择一个既有节点，并指定在该节点前或节点后插入。',
        targetType: 'stage',
        targetCode: stage.stageCode
      })
    }
    if (!enabledNodeMap.has(stage.stageCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '启用阶段未生成节点',
        location: stage.stageName,
        description: '该阶段已启用，但流程图中没有生成对应节点。请保存业务配置后重新校验。',
        targetType: 'stage',
        targetCode: stage.stageCode
      })
    }
    if (stage.assignmentEnabledSwitch === 'checked' && !stage.assignmentMode) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '排程派工方式不能为空',
        location: stage.stageName,
        description: '开启排程派工后，必须选择 AI 排程派工或人工计划派工。',
        targetType: 'stage',
        targetCode: stage.stageCode
      })
    }
  })
}

function validateNodeExecutionRules(enabledNodes, validRoutes, issues) {
  const routeMap = buildRouteMap(validRoutes, 'sourceNodeCode')
  const approvalFlowValues = new Set(approvalFlowOptions.map(item => item.value))
  enabledNodes.forEach(item => {
    if (isExecutorConfigVisible(item)) {
      if (!item.pagePolicy) {
        addValidationIssue(issues, {
          severity: 'warning',
          title: '缺少执行页策略',
          location: item.nodeName,
          description: '当前节点没有执行页策略，运行时可能无法打开执行反馈页面。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
      if (item.assignmentEnabledSwitch !== 'checked' && item.executorSource === 'specifiedNodeExecutor' && !item.executorSourceNodeCode) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '执行人来源缺少节点',
          location: item.nodeName,
          description: '关闭排程派工并选择“指定节点执行人”时，必须指定一个来源节点。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
      if (item.executorSource === 'fixedRole' && !item.fallbackExecutor) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '执行人来源缺少岗位',
          location: item.nodeName,
          description: '选择指定岗位执行人时，必须指定一个岗位。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
      if (item.executorSource === 'manualSelect' && !item.executorPerson) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '执行人来源缺少人员',
          location: item.nodeName,
          description: '选择指定执行人时，必须指定一个人员。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
      Object.entries(item.actionPolicies || {}).forEach(([policyCode, checked]) => {
        if (checked !== 'checked' || !requiresActionPolicyApproval(policyCode)) return
        const approvalFlow = item.actionPolicyApprovalFlows?.[policyCode]
        if (!approvalFlow || !approvalFlowValues.has(approvalFlow)) {
          addValidationIssue(issues, {
            severity: 'error',
            title: '操作能力缺少审批流程',
            location: `${item.nodeName} · ${actionPolicyLabel(policyCode)}`,
            description: '申请加人、换人、延期、终止开启后必须选择有效审批流程。',
            targetType: 'node',
            targetCode: item.nodeCode
          })
        }
      })
    }

    if (item.nodeType === 'approvalFlow') {
      const approvalRoutes = routeMap.get(item.nodeCode) || []
      const hasApprovedRoute = approvalRoutes.some(route => normalizedRouteSourceStatus(route, enabledNodes) === 'approved')
      const hasRejectedRoute = approvalRoutes.some(route => normalizedRouteSourceStatus(route, enabledNodes) === 'rejected' || route.routeType === 'reject')
      if (!item.approvalFlow || !approvalFlowValues.has(item.approvalFlow)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '审批节点缺少有效审批流程',
          location: item.nodeName,
          description: '审批节点必须绑定已发布可用的审批流程。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
      if (!hasApprovedRoute || !hasRejectedRoute) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '审批节点路由不完整',
          location: item.nodeName,
          description: '审批节点必须同时配置审批通过路径和驳回路径。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
    }

    if (item.nodeType === 'systemTask') {
      if (!item.systemActionTemplate || !systemActionOptions.some(option => option.value === item.systemActionTemplate)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '系统节点缺少动作模板',
          location: item.nodeName,
          description: '系统节点必须绑定预置系统动作模板。',
          targetType: 'node',
          targetCode: item.nodeCode
        })
      }
    }
  })
}

function validateApprovalConfigs(workflow, issues) {
  const approvalFlowValues = new Set(approvalFlowOptions.map(item => item.value))
  ;(workflow.approvalConfigs || []).forEach(config => {
    if (config.enabledSwitch !== 'checked') return
    const targetNodeCodes = new Set(approvalTargetNodes(workflow, config).map(item => item.nodeCode))
    if (!String(config.approvalNodeName || '').trim()) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '审批节点名称不能为空',
        location: '审批节点配置',
        description: '启用的审批节点必须填写节点名称。',
        targetType: 'approvalConfig',
        targetCode: config.id
      })
    }
    if (!config.targetStageCode || !targetNodeCodes.has(config.targetStageCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '审批节点挂接位置无效',
        location: config.approvalNodeName || '审批节点配置',
        description: '审批节点必须选择一个有效的流程节点作为插入位置。',
        targetType: 'approvalConfig',
        targetCode: config.id
      })
    }
    if (!config.approvalFlow || !approvalFlowValues.has(config.approvalFlow)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '审批流程无效',
        location: config.approvalNodeName || '审批节点配置',
        description: '启用的审批节点必须绑定有效审批流程。',
        targetType: 'approvalConfig',
        targetCode: config.id
      })
    }
  })
}

function validateSystemNodeConfigs(workflow, issues) {
  const stageCodes = new Set((workflow.stageStrategies || []).map(item => item.stageCode))
  const systemActionValues = new Set(systemActionOptions.map(item => item.value))
  ;(workflow.systemNodeConfigs || []).forEach(config => {
    if (config.enabledSwitch !== 'checked') return
    if (!config.targetStageCode || !stageCodes.has(config.targetStageCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '系统节点挂接位置无效',
        location: config.nodeName || systemActionLabel(config.systemActionTemplate),
        description: '启用的系统节点必须挂接到有效工作阶段。',
        targetType: 'systemConfig',
        targetCode: config.id
      })
    }
    if (!config.systemActionTemplate || !systemActionValues.has(config.systemActionTemplate)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '系统动作模板无效',
        location: config.nodeName || '系统节点配置',
        description: '系统节点必须选择有效的预置系统动作模板。',
        targetType: 'systemConfig',
        targetCode: config.id
      })
    }
  })
}

function validateStatusTransitionConfig(workflow, nodes, issues) {
  const statusCodes = new Set()
  ;(workflow.statusDefinitions || []).forEach(status => {
    if (!String(status.statusCode || '').trim() || !String(status.statusName || '').trim()) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '单据状态信息不完整',
        location: '单据状态配置',
        description: '流程状态字典中的状态编码和状态名称都不能为空。',
        targetType: 'workflow'
      })
      return
    }
    if (statusCodes.has(status.statusCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '单据状态编码重复',
        location: status.statusCode,
        description: '同一工作流程内的单据状态编码必须唯一，外部系统会按该编码识别状态变化。',
        targetType: 'workflow'
      })
    }
    statusCodes.add(status.statusCode)
  })
  if (statusCodes.size === 0) {
    addValidationIssue(issues, {
      severity: 'error',
      title: '缺少流程状态字典',
      location: '单据状态配置',
      description: '每个工作流程必须维护至少一个可对外同步的单据主状态。',
      targetType: 'workflow'
    })
  }

  const nodeMap = new Map(nodes.map(item => [item.nodeCode, item]))
  ;(workflow.statusTransitionRules || []).forEach(rule => {
    if (!statusCodes.has(rule.targetStatusCode)) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '状态流转规则目标状态无效',
        location: rule.ruleName || '状态流转规则',
        description: '状态流转规则必须指向当前流程状态字典中的有效状态。',
        targetType: 'workflow'
      })
    }
    if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
      addValidationIssue(issues, {
        severity: 'error',
        title: '状态流转规则缺少条件',
        location: rule.ruleName || '状态流转规则',
        description: '状态流转必须至少配置一个“节点 + 输出结果”条件。',
        targetType: 'workflow'
      })
    }
    ;(rule.conditions || []).forEach(condition => {
      const nodeItem = nodeMap.get(condition.nodeCode)
      if (!nodeItem || !canUseStatusTransitionNode(nodeItem)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '状态流转条件节点无效',
          location: rule.ruleName || '状态流转规则',
          description: '状态流转条件必须引用当前流程内可产生输出结果的有效节点。',
          targetType: 'workflow'
        })
        return
      }
      const outputValues = new Set(outputStatusOptionsByNode(nodeItem).map(item => item.value))
      if (!outputValues.has(condition.outputResult)) {
        addValidationIssue(issues, {
          severity: 'error',
          title: '状态流转条件输出结果无效',
          location: `${nodeItem.nodeName} · ${rule.ruleName || '状态流转规则'}`,
          description: '节点输出结果必须来自该节点类型可产生的结果，例如完成、通过、驳回或失败。',
          targetType: 'workflow'
        })
      }
    })
  })
}

function addValidationIssue(issues, issue) {
  issues.push({
    id: `validation-${issues.length + 1}-${issue.targetType || 'workflow'}-${issue.targetCode || issue.sourceNodeCode || 'root'}`,
    severity: issue.severity || 'error',
    targetType: 'workflow',
    targetCode: '',
    sourceNodeCode: '',
    location: '流程配置',
    ...issue
  })
}

function buildRouteMap(routes, key) {
  const map = new Map()
  routes.forEach(route => {
    const value = route?.[key]
    if (!value) return
    if (!map.has(value)) map.set(value, [])
    map.get(value).push(route)
  })
  return map
}

function collectReachableNodes(seedNodeCodes, routes, direction) {
  const routeMap = buildRouteMap(routes, direction === 'reverse' ? 'targetNodeCode' : 'sourceNodeCode')
  const visited = new Set(seedNodeCodes.filter(Boolean))
  const queue = [...visited]
  while (queue.length > 0) {
    const nodeCode = queue.shift()
    ;(routeMap.get(nodeCode) || []).forEach(route => {
      const nextCode = direction === 'reverse' ? route.sourceNodeCode : route.targetNodeCode
      if (!nextCode || visited.has(nextCode)) return
      visited.add(nextCode)
      queue.push(nextCode)
    })
  }
  return visited
}

function findNonRejectCycle(nodes, routes) {
  const nodeCodes = new Set(nodes.map(item => item.nodeCode))
  const graph = new Map(nodes.map(item => [item.nodeCode, []]))
  routes
    .filter(route => !isRejectLikeRoute(route) && !isFailureLikeRoute(route) && nodeCodes.has(route.sourceNodeCode) && nodeCodes.has(route.targetNodeCode))
    .forEach(route => graph.get(route.sourceNodeCode).push(route.targetNodeCode))
  const visiting = new Set()
  const visited = new Set()
  const visit = nodeCode => {
    if (visiting.has(nodeCode)) return nodeCode
    if (visited.has(nodeCode)) return ''
    visiting.add(nodeCode)
    const nextNodes = graph.get(nodeCode) || []
    for (const nextCode of nextNodes) {
      const cyclic = visit(nextCode)
      if (cyclic) return cyclic
    }
    visiting.delete(nodeCode)
    visited.add(nodeCode)
    return ''
  }
  for (const item of nodes) {
    const cyclic = visit(item.nodeCode)
    if (cyclic) return cyclic
  }
  return ''
}

function isRejectLikeRoute(route) {
  return route?.routeType === 'reject' || normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || []) === 'rejected'
}

function isFailureLikeRoute(route) {
  return normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || []) === 'failed'
}

function isUnconditionalRoute(route) {
  return !routeConditionText(route) && !isRejectLikeRoute(route)
}

function formatValidationTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function validationIssueTagType(issue) {
  return issue.severity === 'warning' ? 'processing' : 'rejected'
}

function validationIssueSeverityLabel(issue) {
  return issue.severity === 'warning' ? '提醒' : '阻断'
}

function locateValidationIssue(issue) {
  validationVisible.value = false
  const targetType = issue?.targetType || 'workflow'
  if (targetType === 'node') {
    openNodeByCode(issue.targetCode)
  } else if (targetType === 'route') {
    openNodeByCode(issue.sourceNodeCode || issue.targetCode)
  } else if (targetType === 'stage') {
    const stage = (selectedWorkflow.value.stageStrategies || []).find(item => item.stageCode === issue.targetCode)
    if (stage?.enabledSwitch === 'checked') openStageNodeDetail(stage)
    else focusWorkflowConfig()
  } else if (targetType === 'approvalConfig') {
    const config = (selectedWorkflow.value.approvalConfigs || []).find(item => item.id === issue.targetCode)
    if (config?.enabledSwitch === 'checked' && config.targetStageCode) openApprovalNodeDetail(config)
    else focusWorkflowConfig()
  } else if (targetType === 'systemConfig') {
    const config = (selectedWorkflow.value.systemNodeConfigs || []).find(item => item.id === issue.targetCode)
    if (config?.enabledSwitch === 'checked' && config.targetStageCode) openSystemNodeDetail(config)
    else focusWorkflowConfig()
  } else {
    focusWorkflowConfig()
  }
  showToast('已定位到对应配置，请调整后重新校验。')
}

function openNodeByCode(nodeCode) {
  const nodeItem = (selectedWorkflow.value.nodes || []).find(item => item.nodeCode === nodeCode)
  if (!nodeItem) {
    focusWorkflowConfig()
    return
  }
  openNodeDetail(nodeItem)
}

function focusWorkflowConfig() {
  closeNodeDetail()
  selectWholeWorkflow()
}

function refreshCanvas() {
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  normalizeWorkflowStatusSettings(selectedWorkflow.value)
  strategyDirty.value = false
  routeWarning.value = false
  canvasNotice.value = '流程图已根据当前策略重新生成。'
}

function syncWorkflowAfterNodeConfigChange(message = '流程图已根据当前节点配置自动更新。') {
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  normalizeWorkflowStatusSettings(selectedWorkflow.value)
  refreshOpenNodeDetailAfterRebuild()
  markStrategyDirty()
  canvasNotice.value = message
  persistWorkflows()
}

function changeApprovalConfig(config) {
  if (!config) return
  const firstTarget = defaultApprovalTargetNode(selectedWorkflow.value)
  if (!config.targetStageCode && firstTarget) config.targetStageCode = firstTarget.nodeCode
  config.position = config.position || 'before'
  syncWorkflowAfterNodeConfigChange('审批节点配置已更新，流程图已同步重算。')
}

function changeSystemNodeConfig(config) {
  if (!config) return
  syncWorkflowAfterNodeConfigChange('系统节点配置已更新，流程图已同步重算。')
}

function addApprovalConfig() {
  const firstTarget = defaultApprovalTargetNode(selectedWorkflow.value)
  selectedWorkflow.value.approvalConfigs.push({
    id: `approval-${approvalSeq++}`,
    approvalNodeName: `${firstTarget?.nodeName || '新增'}审批`,
    enabledSwitch: 'checked',
    position: 'before',
    targetStageCode: firstTarget?.nodeCode || '',
    approvalFlow: approvalFlowByWorkType(selectedWorkflow.value.workTypeCode),
    rejectPolicy: 'returnPreviousStage',
    customApproval: true
  })
  syncWorkflowAfterNodeConfigChange('审批节点已添加，流程图已同步生成。')
}

function removeApprovalConfig(id) {
  const workflow = selectedWorkflow.value
  const config = (workflow.approvalConfigs || []).find(item => item.id === id)
  if (!config) return
  const relatedNodeCode = config.nodeCode || (workflow.nodes || []).find(item => item.approvalConfigId === id)?.nodeCode || ''
  if (config.nodeCode) {
    workflow.deletedApprovalNodeCodes = Array.from(new Set([...(workflow.deletedApprovalNodeCodes || []), config.nodeCode]))
  }
  workflow.approvalConfigs = (workflow.approvalConfigs || []).filter(item => item.id !== id)
  if (relatedNodeCode) {
    const isRelatedRoute = route => route?.sourceNodeCode === relatedNodeCode || route?.targetNodeCode === relatedNodeCode
    workflow.routes = (workflow.routes || []).filter(route => !isRelatedRoute(route))
    workflow.routeConditionRules = (workflow.routeConditionRules || []).filter(rule => !isRelatedRoute(rule))
    workflow.disabledRouteRules = (workflow.disabledRouteRules || []).filter(rule => !isRelatedRoute(rule))
    workflow.statusTransitionRules = (workflow.statusTransitionRules || [])
      .map(rule => ({
        ...rule,
        conditions: (rule.conditions || []).filter(condition => condition.nodeCode !== relatedNodeCode)
      }))
      .filter(rule => (rule.conditions || []).length > 0)
    if (selectedElement.value?.type === 'node' && selectedElement.value.id === relatedNodeCode) closeNodeDetail()
  }
  syncWorkflowAfterNodeConfigChange('审批节点已删除，流程图已同步更新。')
}

function startBatchPublish() {
  batchPublishMode.value = true
  workflows.value.forEach(item => {
    item.publishChecked = 'uncheck'
  })
  canvasNotice.value = '已进入批量发布模式，请在左侧勾选需要发布的草稿流程。'
}

function cancelBatchPublish() {
  batchPublishMode.value = false
  workflows.value.forEach(item => {
    item.publishChecked = 'uncheck'
  })
  canvasNotice.value = '已退出批量发布模式。'
}

function markPublishSelection() {
  canvasNotice.value = publishSelectedCount.value > 0 ? `已勾选 ${publishSelectedCount.value} 个草稿流程，可统一提交发布。` : '已取消全部发布勾选。'
}

function publishSelectedWorkflows() {
  if (!batchPublishMode.value) {
    startBatchPublish()
    return
  }
  const selected = workflows.value.filter(item => item.publishChecked === 'checked')
  if (selected.length === 0) {
    canvasNotice.value = '请先在左侧工作流程列表勾选需要发布的草稿流程。'
    return
  }
  saveMessage.value = `已提交 ${selected.length} 个草稿流程发布。当前页面仍保留草稿配置，发布后的正式流程请在发布版本页面查看。`
  selected.forEach(item => {
    item.publishChecked = 'uncheck'
    item.lastPublishAction = 'submitted'
  })
  batchPublishMode.value = false
  canvasNotice.value = '已提交勾选流程发布，当前草稿工作区不展示正式发布状态。'
  persistWorkflows()
  showToast(saveMessage.value)
}

function startCanvasDrag(event) {
  if (event.button !== undefined && event.button !== 0) return
  if (event.target?.closest?.('button, input, textarea, select, .m-select, .m-switch')) return
  const target = event.currentTarget
  canvasDragState.value = {
    active: true,
    didDrag: false,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: target.scrollLeft,
    scrollTop: target.scrollTop
  }
}

function dragCanvas(event) {
  if (!canvasDragState.value.active) return
  const target = event.currentTarget
  const deltaX = event.clientX - canvasDragState.value.startX
  const deltaY = event.clientY - canvasDragState.value.startY
  if (!canvasDragState.value.didDrag && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
    canvasDragState.value.didDrag = true
  }
  if (!canvasDragState.value.didDrag) return
  event.preventDefault()
  target.scrollLeft = canvasDragState.value.scrollLeft - deltaX
  target.scrollTop = canvasDragState.value.scrollTop - deltaY
}

function endCanvasDrag(event) {
  const wasDrag = canvasDragState.value.didDrag
  canvasDragState.value.active = false
  canvasDragState.value.pointerId = null
  if (!wasDrag) {
    canvasDragState.value.didDrag = false
    return
  }
  window.setTimeout(() => {
    if (!canvasDragState.value.active) canvasDragState.value.didDrag = false
  }, 180)
}

function saveGlobalStrategy() {
  savingStrategy.value = true
  persistNodeDetailDraft()
  selectedWorkflow.value.conditionSummary = conditionText(selectedWorkflow.value)
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  normalizeWorkflowStatusSettings(selectedWorkflow.value)
  strategyDirty.value = false
  routeWarning.value = false
  canvasNotice.value = '业务配置已保存，流程图已自动刷新。'
  savingStrategy.value = false
  saveMessage.value = '工作流程保存成功，已自动更新流程。'
  persistWorkflows()
  showToast(saveMessage.value)
  refreshOpenNodeDetailAfterRebuild()
}

function rebuildWorkflowByStrategies(workflow) {
  const previousRoutes = workflow.routes || []
  syncAllCustomStagePlacements(workflow)
  const sourceNodes = ensureBaseNodes(workflow)
  applyStageLockRules(workflow)
  normalizeStageAssignmentStrategies(workflow)
  const startNode = sourceNodes.find(item => item.nodeType === 'start') || node('start', startNodeNameByWorkType(workflow.workTypeCode), 'start')
  const endNode = sourceNodes.find(item => item.nodeType === 'end') || node('end', endNodeNameByWorkType(workflow.workTypeCode), 'end')
  const stageMap = new Map((workflow.stageStrategies || []).map(stage => [stage.stageCode, stage]))
  const generatedNodes = []
  const insertedApprovalConfigIds = new Set()
  const appendApprovalNodesForTarget = (target, position) => {
    enabledApprovalConfigs(workflow, target.nodeCode || target.stageCode, position).forEach(config => {
      if (insertedApprovalConfigIds.has(config.id)) return
      generatedNodes.push(createApprovalNode(config, target, workflow))
      insertedApprovalConfigIds.add(config.id)
    })
  }
  const appendNodeWithApprovals = target => {
    appendApprovalNodesForTarget(target, 'before')
    generatedNodes.push(target)
    appendApprovalNodesForTarget(target, 'after')
  }

  appendNodeWithApprovals(normalizeWorkflowNodes([startNode], workflow.workTypeCode)[0])

  sourceNodes.forEach(item => {
    if (item.nodeType === 'start' || item.nodeType === 'end' || item.nodeType === 'approvalFlow') return
    if (item.nodeType === 'systemTask') {
      const hasManagedSystemConfig = (workflow.systemNodeConfigs || []).some(config =>
        config.nodeCode === item.nodeCode
        || (config.systemActionTemplate && config.systemActionTemplate === item.systemActionTemplate)
      )
      if (item.inlineSystemTask && item.enabled !== false && !hasManagedSystemConfig) {
        appendNodeWithApprovals(normalizeWorkflowNodes([{ ...item, nodeStatus: 'generated' }], workflow.workTypeCode)[0])
      }
      return
    }

    if (item.nodeType === 'workStage' || item.nodeType === 'businessFlow') {
      const stage = stageMap.get(item.nodeCode)
      if (!stage || stage.enabledSwitch !== 'checked') return

      appendApprovalNodesForTarget({ ...stage, nodeCode: stage.stageCode, nodeName: stage.stageName }, 'before')
      enabledSystemNodeConfigs(workflow, stage.stageCode, 'before').forEach(config => appendNodeWithApprovals(createSystemNode(config)))
      if (shouldGenerateAssignmentNode(sourceNodes, stage, 'system')) {
        appendNodeWithApprovals(createAiScheduleNode(workflow, stage))
      }
      if (shouldGenerateAssignmentNode(sourceNodes, stage, 'manual')) {
        appendNodeWithApprovals(createScheduleDispatchNode(workflow, stage))
      }
      generatedNodes.push(createStageNode(workflow, stage))
      appendApprovalNodesForTarget({ ...stage, nodeCode: stage.stageCode, nodeName: stage.stageName }, 'after')
      enabledSystemNodeConfigs(workflow, stage.stageCode, 'after').forEach(config => appendNodeWithApprovals(createSystemNode(config)))
      return
    }

    if (item.enabled !== false) {
      appendNodeWithApprovals(normalizeWorkflowNodes([{ ...item, nodeStatus: 'generated' }], workflow.workTypeCode)[0])
    }
  })

  appendNodeWithApprovals(normalizeWorkflowNodes([endNode], workflow.workTypeCode)[0])
  insertApprovalNodesForGeneratedApprovalTargets(workflow, generatedNodes, insertedApprovalConfigIds)
  workflow.nodes = generatedNodes
  ensureWorkflowDataPermissionSettings(workflow)
  workflow.routes = applyStoredRouteRules(buildGeneratedRoutes(workflow.nodes), previousRoutes, workflow.nodes, workflow)
}

function insertApprovalNodesForGeneratedApprovalTargets(workflow, generatedNodes, insertedApprovalConfigIds) {
  const enabledConfigs = (workflow.approvalConfigs || []).filter(config => config.enabledSwitch === 'checked')
  let inserted = true
  while (inserted) {
    inserted = false
    enabledConfigs.forEach(config => {
      if (insertedApprovalConfigIds.has(config.id)) return
      const targetIndex = generatedNodes.findIndex(item => item.nodeCode === config.targetStageCode)
      if (targetIndex < 0) return
      const targetNode = generatedNodes[targetIndex]
      const approvalNode = createApprovalNode(config, targetNode, workflow)
      generatedNodes.splice(config.position === 'after' ? targetIndex + 1 : targetIndex, 0, approvalNode)
      insertedApprovalConfigIds.add(config.id)
      inserted = true
    })
  }
}

function shouldGenerateAssignmentNode(sourceNodes, stage, mode) {
  return stage.assignmentEnabledSwitch === 'checked'
    && stage.assignmentMode === mode
    && stage.stageTemplate !== 'dispatch'
    && !hasExplicitAssignmentNode(sourceNodes, stage.stageCode)
}

function hasExplicitAssignmentNode(sourceNodes, stageCode) {
  return sourceNodes.some(item => item.nodeType === 'dispatchFlow' && item.assignmentTargetStageCode === stageCode)
}

function buildGeneratedRoutes(nodes, routeLabels = []) {
  const routes = []
  nodes.slice(0, -1).forEach((item, index) => {
    const nextNode = nodes[index + 1]
    routes.push({
      sourceNodeCode: item.nodeCode,
      targetNodeCode: nextNode.nodeCode,
      sourceStatus: defaultRouteStatusForNode(item),
      conditionSummary: routeLabels[index] || generatedRouteLabel(item, nextNode),
      routeType: item.nodeType === 'approvalFlow' ? 'approve' : 'default',
      priority: String((routes.length + 1) * 10)
    })
    if (item.nodeType === 'approvalFlow' && index > 0) {
      routes.push({
        sourceNodeCode: item.nodeCode,
        targetNodeCode: nodes[index - 1].nodeCode,
        sourceStatus: 'rejected',
        conditionSummary: '审批驳回',
        routeType: 'reject',
        priority: String((routes.length + 1) * 10)
      })
    }
  })
  return routes
}

function applyStoredRouteRules(routes, previousRoutes, nodes, workflow) {
  const storedConditions = collectStoredRouteConditions(workflow, previousRoutes, nodes)
  const consumedStoredRouteKeys = new Set()
  const disabledRules = workflow?.disabledRouteRules || []
  const activeGeneratedRoutes = routes.filter(route => !isDisabledGeneratedRoute(route, disabledRules, nodes))
  const mergedRoutes = activeGeneratedRoutes.map(route => {
    const matched = findStoredRouteCondition(storedConditions, route, nodes)
    if (!matched) return normalizeRoute(route, nodes)
    consumedStoredRouteKeys.add(routeConditionRuleKey(matched))
    const exactMatch = isSameRouteForNodes(matched, route, nodes)
    return normalizeRoute({
      ...route,
      sourceStatus: matched.sourceStatus || normalizedRouteSourceStatus(route, nodes),
      targetNodeCode: exactMatch ? (matched.targetNodeCode || route.targetNodeCode) : route.targetNodeCode,
      conditionSummary: matched.conditionSummary || route.conditionSummary,
      extraConditions: cloneRouteConditionRules(matched.extraConditions),
      entryConfigured: matched.entryConfigured === true,
      entryLogicMode: matched.entryLogicMode || route.entryLogicMode || ''
    }, nodes)
  })
  const generatedKeys = new Set(mergedRoutes.map(routeConditionRuleKey))
  const customRoutes = storedConditions
    .filter(rule => !generatedKeys.has(routeConditionRuleKey(rule)) && !consumedStoredRouteKeys.has(routeConditionRuleKey(rule)))
    .map((rule, index) => normalizeRoute({
      sourceNodeCode: rule.sourceNodeCode,
      targetNodeCode: rule.targetNodeCode,
      sourceStatus: rule.sourceStatus,
      conditionSummary: rule.conditionSummary || outputResultLabel(nodes.find(item => item.nodeCode === rule.sourceNodeCode), rule.sourceStatus),
      routeType: rule.routeType || routeTypeForStatus(nodes.find(item => item.nodeCode === rule.sourceNodeCode), rule.sourceStatus),
      priority: rule.priority || String((mergedRoutes.length + index + 1) * 10),
      extraConditions: cloneRouteConditionRules(rule.extraConditions).filter(isConditionRuleComplete),
      entryConfigured: rule.entryConfigured === true,
      entryLogicMode: rule.entryLogicMode || ''
    }, nodes))
    .filter(route => nodes.some(item => item.nodeCode === route.sourceNodeCode) && nodes.some(item => item.nodeCode === route.targetNodeCode))
  const nextRoutes = dedupeRoutes([...mergedRoutes, ...customRoutes])
  return nextRoutes
}

function isDisabledGeneratedRoute(route, disabledRules = [], nodes = []) {
  const normalized = normalizeRoute(route, nodes)
  const routeKey = routeConditionRuleKey(normalized)
  return disabledRules.some(rule => {
    if (routeConditionRuleKey(rule) === routeKey) return true
    const disabledTargetStillExists = nodes.some(item => item.nodeCode === rule.targetNodeCode)
    return !disabledTargetStillExists
      && rule.sourceNodeCode === normalized.sourceNodeCode
      && (rule.sourceStatus || 'completed') === normalized.sourceStatus
      && (rule.routeType || 'default') === (normalized.routeType || 'default')
  })
}

function createAiScheduleNode(workflow, stage) {
  return node(`${stage.stageCode}-ai-schedule`, 'AI排程派工', 'systemTask', {
    pagePolicy: 'dispatchPage',
    systemActionTemplate: 'aiScheduleDispatch',
    systemActionTiming: 'beforeStage',
    systemActionFailure: 'warnContinue',
    notifyTarget: 'dispatcher',
    fallbackExecutor: 'engineeringSupervisor',
    slaPolicy: slaByWorkType(workflow.workTypeCode),
    actionSummary: `系统为${stage.stageName}计算执行人、班组和排程建议`,
    nodeStatus: 'generated'
  })
}

function createScheduleDispatchNode(workflow, stage) {
  const actionPolicies = stage.dispatchActionPolicies || defaultActionPolicies(stage.dispatchActionSummary || '')
  return node(`${stage.stageCode}-schedule-dispatch`, '人工排程派工', 'dispatchFlow', {
    executionMode: 'singleExecutor',
    pagePolicy: 'dispatchPage',
    executorSource: stage.dispatchExecutorSource || 'fixedRole',
    fallbackExecutor: stage.dispatchFallbackExecutor || 'operationDispatcher',
    executorPerson: stage.dispatchExecutorPerson || 'u-zhang-wei',
    actionPolicies,
    actionPolicyApprovalFlows: {
      ...defaultActionPolicyApprovalFlows(actionPolicies, workflow.workTypeCode),
      ...(stage.dispatchActionPolicyApprovalFlows || {})
    },
    slaPolicy: slaByWorkType(workflow.workTypeCode),
    actionSummary: `${executorSourceSummary(stage.dispatchExecutorSource || 'fixedRole', stage.dispatchFallbackExecutor, stage.dispatchExecutorPerson)}负责为${stage.stageName}指定执行人`,
    nodeStatus: 'generated'
  })
}

function createStageNode(workflow, stage) {
  const source = ensureBaseNodes(workflow).find(item => item.nodeCode === stage.stageCode) || workflow.nodes.find(item => item.nodeCode === stage.stageCode) || {}
  const stageNodeType = source.nodeType === 'workStage' ? 'workStage' : (stage.stageTemplate === 'externalCollaboration' ? 'businessFlow' : 'workStage')
  return node(stage.stageCode, stage.stageName, stageNodeType, {
    enabled: true,
    enabledSwitch: 'checked',
    stageTemplate: stage.stageTemplate,
    executionMode: source.executionMode || 'candidateAnyOne',
    pagePolicy: source.pagePolicy || pagePolicyByStage(stage.stageTemplate, workflow.workTypeCode),
    executorSource: normalizeExecutorSourceForNode(source, stage),
    executorSourceNodeCode: source.executorSourceNodeCode || '',
    executorPerson: source.executorPerson || 'u-zhang-wei',
    fallbackExecutor: source.fallbackExecutor || 'engineeringSupervisor',
    slaPolicy: source.slaPolicy || slaByWorkType(workflow.workTypeCode),
    assignmentEnabledSwitch: stage.assignmentEnabledSwitch || 'uncheck',
    assignmentMode: stage.assignmentMode || 'system',
    assignmentTargetType: stage.assignmentTargetType || 'role',
    assignmentTarget: stage.assignmentTarget || 'operationDispatcher',
    actionPolicies: source.actionPolicies || defaultActionPolicies(source.actionSummary || ''),
    actionPolicyApprovalFlows: source.actionPolicyApprovalFlows || defaultActionPolicyApprovalFlows(source.actionPolicies || defaultActionPolicies(source.actionSummary || ''), workflow.workTypeCode),
    executionPageDataPermissions: normalizeDataPermissions(source.executionPageDataPermissions, source, workflow),
    customStage: source.customStage === true || stage.customStage === true,
    customDataItems: normalizeCustomDataItems(source.customDataItems || []),
    allowRejectSwitch: source.allowRejectSwitch || 'uncheck',
    rejectTargetNodeCode: source.rejectTargetNodeCode || '',
    actionSummary: source.actionSummary || '系统按规则自动分配执行人',
    statusOutputOptions: normalizeStatusOutputOptionsForNode(source, source.statusOutputOptions),
    nodeStatus: 'generated'
  })
}

function createApprovalNode(config, stage, workflow) {
  const targetCode = stage.stageCode || stage.nodeCode
  const targetName = stage.stageName || stage.nodeName
  return node(config.nodeCode || `${targetCode}-approval-${config.position}-${config.id}`, config.approvalNodeName || `${targetName}${config.position === 'before' ? '前' : '后'}审批`, 'approvalFlow', {
    pagePolicy: 'approvalPage',
    approvalConfigId: config.id,
    approvalFlow: config.approvalFlow,
    rejectPolicy: config.rejectPolicy || 'returnPreviousStage',
    actionSummary: approvalFlowLabel(config.approvalFlow),
    executionPageDataPermissions: normalizeDataPermissions(config.executionPageDataPermissions, { nodeType: 'approvalFlow', nodeName: config.approvalNodeName }, workflow),
    customApproval: isCustomApprovalConfig(config),
    nodeStatus: 'generated'
  })
}

function createSystemNode(config) {
  return node(config.nodeCode || `${config.targetStageCode}-system-${config.position}-${config.systemActionTemplate}`, config.nodeName || systemActionLabel(config.systemActionTemplate), 'systemTask', {
    pagePolicy: config.pagePolicy || 'archivePage',
    systemConfigId: config.id,
    targetStageCode: config.targetStageCode,
    position: config.position,
    systemActionTemplate: config.systemActionTemplate,
    systemActionTiming: config.position === 'before' ? 'beforeStage' : 'afterStage',
    systemActionFailure: config.systemActionFailure || 'manualCompensate',
    notifyTarget: config.notifyTarget || 'systemAdmin',
    actionSummary: config.description || config.actionSummary || systemActionLabel(config.systemActionTemplate),
    statusOutputOptions: cloneStatusOutputOptions(config.statusOutputOptions),
    nodeStatus: 'generated'
  })
}

function isStageNode(item) {
  return item?.nodeType === 'workStage' || item?.nodeType === 'businessFlow'
}

function isApprovalTargetNode(item) {
  return !!item && !!item.nodeCode && item.enabled !== false
}

function isDefaultApprovalAttachTargetNode(item) {
  return isApprovalTargetNode(item) && item.nodeType !== 'approvalFlow' && item.nodeType !== 'systemTask'
}

function approvalTargetNodes(workflow, config = null) {
  const nodes = Array.isArray(workflow?.nodes) && workflow.nodes.length > 0
    ? workflow.nodes
    : (Array.isArray(workflow?.baseNodes) ? workflow.baseNodes : [])
  const seen = new Set()
  return nodes
    .filter(isApprovalTargetNode)
    .filter(item => {
      if (config?.id && item.approvalConfigId === config.id) return false
      if (config?.nodeCode && item.nodeCode === config.nodeCode) return false
      if (seen.has(item.nodeCode)) return false
      seen.add(item.nodeCode)
      return true
    })
}

function defaultApprovalTargetNode(workflow) {
  return approvalTargetNodes(workflow).find(isStageNode) || approvalTargetNodes(workflow)[0]
}

function isRequiredStage(item, workTypeCode) {
  const stageName = item.stageName || item.nodeName || ''
  const stageCode = item.stageCode || item.nodeCode || ''
  const requiredRules = {
    inspection: [/巡检执行/],
    maintenance: [/维保执行/],
    repair: [/维修方案/, /维修执行/],
    serviceRequest: [/报事报修定性/, /报事定性/, /结果验收/],
    engineeringChange: [/方案制定/, /改造执行/, /改造验收/, /承包商施工执行/, /^contractorExecution$/]
  }
  return (requiredRules[workTypeCode] || []).some(pattern => pattern.test(stageName) || pattern.test(stageCode))
}

function applyStageLockRules(workflow) {
  ;(workflow.stageStrategies || []).forEach(stage => {
    stage.required = false
    stage.core = false
    stage.canDisable = true
    stage.enabledSwitch = stage.enabledSwitch || 'checked'
  })
}

function normalizeStageAssignmentStrategies(workflow) {
  ;(workflow.stageStrategies || []).forEach(stage => {
    stage.assignmentEnabledSwitch = stage.assignmentEnabledSwitch || 'uncheck'
    stage.assignmentMode = stage.assignmentMode || 'system'
    stage.assignmentTargetType = stage.assignmentTargetType || 'role'
    stage.assignmentTarget = stage.assignmentTarget || 'operationDispatcher'
    stage.dispatchExecutorSource = dispatchNodeExecutorSourceOptions.some(option => option.value === stage.dispatchExecutorSource) ? stage.dispatchExecutorSource : 'fixedRole'
    stage.dispatchFallbackExecutor = stage.dispatchFallbackExecutor || 'operationDispatcher'
    stage.dispatchExecutorPerson = stage.dispatchExecutorPerson || 'u-zhang-wei'
    stage.dispatchActionPolicies = {
      ...blankActionPolicies,
      ...(stage.dispatchActionPolicies || {})
    }
    stage.dispatchActionPolicyApprovalFlows = {
      ...blankActionPolicyApprovalFlows,
      ...(stage.dispatchActionPolicyApprovalFlows || {})
    }
    if (isCustomStageStrategy(stage)) {
      const target = defaultStageInsertTargetNode(workflow, stage)
      stage.targetStageCode = stage.targetStageCode || target?.nodeCode || ''
      stage.position = stage.position || 'after'
    }
  })
}

function buildStageStrategies(nodes, classificationCode) {
  const workTypeCode = classificationWorkType(classificationCode)
  return nodes
    .filter(isStageNode)
    .map(item => {
      const stageTemplate = inferStageTemplate(item, workTypeCode)
      return {
        id: `stage-${stageSeq++}`,
        stageCode: item.nodeCode,
        stageName: item.nodeName,
        stageTemplate,
        core: false,
        required: false,
        canDisable: true,
        enabledSwitch: item.enabled !== false ? 'checked' : 'uncheck',
        assignmentEnabledSwitch: item.assignmentEnabledSwitch || 'uncheck',
        assignmentMode: item.assignmentMode || 'system',
        assignmentTargetType: item.assignmentTargetType || 'role',
        assignmentTarget: item.assignmentTarget || 'operationDispatcher',
        dispatchExecutorSource: item.dispatchExecutorSource || 'fixedRole',
        dispatchFallbackExecutor: item.dispatchFallbackExecutor || 'operationDispatcher',
        dispatchExecutorPerson: item.dispatchExecutorPerson || 'u-zhang-wei',
        dispatchActionPolicies: item.dispatchActionPolicies || { ...blankActionPolicies },
        dispatchActionPolicyApprovalFlows: item.dispatchActionPolicyApprovalFlows || { ...blankActionPolicyApprovalFlows },
        customStage: item.customStage === true,
        targetStageCode: item.targetStageCode || '',
        position: item.position || 'after'
      }
    })
}

function buildApprovalConfigs(nodes, classificationCode, stageStrategies) {
  const workTypeCode = classificationWorkType(classificationCode)
  return nodes
    .filter(item => item.nodeType === 'approvalFlow')
    .map(item => {
      const index = nodes.findIndex(nodeItem => nodeItem.nodeCode === item.nodeCode)
      const nextStage = nodes.slice(index + 1).find(isDefaultApprovalAttachTargetNode)
      const prevStage = [...nodes.slice(0, index)].reverse().find(isDefaultApprovalAttachTargetNode)
      const firstTarget = nodes.find(isDefaultApprovalAttachTargetNode) || defaultApprovalTargetNode({ baseNodes: nodes })
      const targetStageCode = nextStage?.nodeCode || prevStage?.nodeCode || firstTarget?.nodeCode || stageStrategies[0]?.stageCode || ''
      return {
        id: `approval-${approvalSeq++}`,
        nodeCode: item.nodeCode || '',
        approvalNodeName: item.nodeName || `${nextStage?.nodeName || prevStage?.nodeName || '节点'}审批`,
        enabledSwitch: 'checked',
        position: item.position || (nextStage ? 'before' : 'after'),
        targetStageCode: item.targetStageCode || targetStageCode,
        approvalFlow: item.approvalFlow || approvalFlowByWorkType(workTypeCode),
        rejectPolicy: item.rejectPolicy || 'returnPreviousStage',
        executionPageDataPermissions: normalizeDataPermissions(item.executionPageDataPermissions, item, { workTypeCode })
      }
    })
}

function buildSystemNodeConfigs(nodes, workTypeCode, stageStrategies) {
  const existingSystemNodes = nodes.filter(item => item.nodeType === 'systemTask')
  const templates = systemNodeTemplatesByWorkType(workTypeCode, stageStrategies)
  const templateConfigs = templates.map(template => {
    const matched = existingSystemNodes.find(item => item.systemActionTemplate === template.systemActionTemplate || item.nodeName === template.nodeName)
    return {
      id: `system-${systemNodeSeq++}`,
      ...template,
      nodeCode: matched?.nodeCode || template.nodeCode || '',
      nodeName: matched?.nodeName || template.nodeName,
      pagePolicy: matched?.pagePolicy || template.pagePolicy,
      position: matched?.position || template.position,
      targetStageCode: matched?.targetStageCode || template.targetStageCode,
      enabledSwitch: matched ? 'checked' : template.enabledSwitch,
      systemActionFailure: matched?.systemActionFailure || 'manualCompensate',
      notifyTarget: matched?.notifyTarget || 'systemAdmin',
      statusOutputOptions: normalizeStatusOutputOptionsForNode(
        { nodeType: 'systemTask', systemActionTemplate: matched?.systemActionTemplate || template.systemActionTemplate },
        matched?.statusOutputOptions || template.statusOutputOptions
      ),
      description: matched?.actionSummary || matched?.description || template.description
    }
  })
  const matchedNodeCodes = new Set(templateConfigs.map(item => item.nodeCode).filter(Boolean))
  const explicitConfigs = existingSystemNodes
    .filter(item => item.targetStageCode && item.position && !matchedNodeCodes.has(item.nodeCode))
    .map(item => ({
      id: `system-${systemNodeSeq++}`,
      nodeCode: item.nodeCode,
      nodeName: item.nodeName,
      systemActionTemplate: item.systemActionTemplate,
      pagePolicy: item.pagePolicy,
      position: item.position,
      targetStageCode: item.targetStageCode,
      enabledSwitch: item.enabled === false ? 'uncheck' : item.enabledSwitch || 'checked',
      systemActionFailure: item.systemActionFailure || 'manualCompensate',
      notifyTarget: item.notifyTarget || 'systemAdmin',
      statusOutputOptions: normalizeStatusOutputOptionsForNode(item, item.statusOutputOptions),
      description: item.actionSummary || item.description || ''
    }))
  return [...templateConfigs, ...explicitConfigs]
}

function mergeSystemNodeConfigsWithTemplates(workflow, nodes = ensureBaseNodes(workflow)) {
  if (!workflow) return []
  const existingConfigs = Array.isArray(workflow.systemNodeConfigs) ? workflow.systemNodeConfigs : []
  const templateConfigs = buildSystemNodeConfigs(nodes, workflow.workTypeCode, workflow.stageStrategies || [])
  const usedExistingIds = new Set()
  const findExistingConfig = template => existingConfigs.find(config => {
    if (!config) return false
    if (template.systemActionTemplate && config.systemActionTemplate === template.systemActionTemplate) return true
    if (template.nodeCode && config.nodeCode === template.nodeCode) return true
    return template.nodeName && config.nodeName === template.nodeName
  })

  const mergedTemplates = templateConfigs.map(template => {
    const existing = findExistingConfig(template)
    if (existing?.id) usedExistingIds.add(existing.id)
    const merged = {
      ...template,
      ...(existing || {}),
      id: existing?.id || template.id,
      nodeCode: existing?.nodeCode || template.nodeCode,
      nodeName: existing?.nodeName || template.nodeName,
      pagePolicy: existing?.pagePolicy || template.pagePolicy,
      position: existing?.position || template.position,
      targetStageCode: existing?.targetStageCode || template.targetStageCode,
      enabledSwitch: existing?.enabledSwitch || template.enabledSwitch,
      description: existing?.description || template.description
    }
    merged.statusOutputOptions = normalizeStatusOutputOptionsForNode(
      { nodeType: 'systemTask', systemActionTemplate: merged.systemActionTemplate },
      merged.statusOutputOptions
    )
    return merged
  })

  const extraConfigs = existingConfigs
    .filter(config => config?.id && !usedExistingIds.has(config.id))
    .map(config => ({
      ...config,
      statusOutputOptions: normalizeStatusOutputOptionsForNode(
        { nodeType: 'systemTask', systemActionTemplate: config.systemActionTemplate },
        config.statusOutputOptions
      )
    }))
  return [...mergedTemplates, ...extraConfigs]
}

function systemNodeTemplatesByWorkType(workTypeCode, stageStrategies = []) {
  const firstStage = stageStrategies[0]?.stageCode || 'execute'
  const lastStage = stageStrategies[stageStrategies.length - 1]?.stageCode || firstStage
  const resourceStage = stageStrategies.find(item => /资源|物料|维保|维修|执行/.test(item.stageName))?.stageCode || firstStage
  const stageCodeByName = (...patterns) => stageStrategies.find(stage => patterns.some(pattern => stage.stageName.includes(pattern)))?.stageCode || ''
  const maintenanceExecuteStage = stageCodeByName('维保执行') || resourceStage
  const repairExecuteStage = stageCodeByName('维修执行') || resourceStage
  const serviceClassifyStage = stageCodeByName('报事报修定性', '报事定性', '诉求分类') || firstStage
  const engineeringPlanStage = stageCodeByName('方案制定') || firstStage
  const engineeringExecutionStage = stageCodeByName('改造执行') || resourceStage
  const engineeringAcceptanceStage = stageCodeByName('改造验收') || lastStage
  const base = [
    {
      nodeName: '归档状态回写',
      systemActionTemplate: 'archiveWriteBack',
      position: 'after',
      targetStageCode: lastStage,
      enabledSwitch: 'checked',
      description: '流程关闭后回写单据状态、处理时长和归档标记。'
    }
  ]
  const map = {
    inspection: [],
    maintenance: [
      {
        nodeName: 'ERP物料可用校验',
        systemActionTemplate: 'erpMaterialCheck',
        position: 'before',
        targetStageCode: maintenanceExecuteStage,
        enabledSwitch: 'uncheck',
        description: '进入维保执行或物料准备前校验备件可用性。'
      },
      {
        nodeName: 'ERP费用回写',
        systemActionTemplate: 'erpCostWriteBack',
        position: 'after',
        targetStageCode: lastStage,
        enabledSwitch: 'uncheck',
        description: '维保验收后回写费用和工时数据。'
      },
      {
        nodeName: '供应商协同通知',
        systemActionTemplate: 'supplierNotify',
        position: 'before',
        targetStageCode: maintenanceExecuteStage,
        enabledSwitch: 'uncheck',
        description: '外委维保或第三方检测前通知供应商接单和反馈。'
      }
    ],
    repair: [
      {
        nodeName: 'ERP物料可用校验',
        systemActionTemplate: 'erpMaterialCheck',
        position: 'before',
        targetStageCode: repairExecuteStage,
        enabledSwitch: 'uncheck',
        description: '维修执行前校验备件、耗材或工具资源。'
      },
      {
        nodeName: '供应商协同通知',
        systemActionTemplate: 'supplierNotify',
        position: 'before',
        targetStageCode: repairExecuteStage,
        enabledSwitch: 'uncheck',
        description: '外委维修前通知供应商接单和反馈。'
      },
      {
        nodeName: 'ERP费用回写',
        systemActionTemplate: 'erpCostWriteBack',
        position: 'after',
        targetStageCode: lastStage,
        enabledSwitch: 'uncheck',
        description: '维修验收后回写工时、物料和外委服务费用。'
      }
    ],
    serviceRequest: [
      {
        nodeName: '报事派生工单',
        systemActionTemplate: 'serviceOrderDerive',
        position: 'after',
        targetStageCode: serviceClassifyStage,
        enabledSwitch: 'uncheck',
        description: '用户报事受理后按分类派生巡检、维修或改造工单。'
      },
      {
        nodeName: 'ERP费用回写',
        systemActionTemplate: 'erpCostWriteBack',
        position: 'after',
        targetStageCode: lastStage,
        enabledSwitch: 'uncheck',
        description: '收费类工程服务完成后回写费用数据。'
      }
    ],
    engineeringChange: [
      {
        nodeName: 'SAP预算校验',
        systemActionTemplate: 'sapBudgetCheck',
        position: 'after',
        targetStageCode: engineeringPlanStage,
        enabledSwitch: 'uncheck',
        description: '方案提交审批后将工单、预算、科目和合同信息发送 SAP 做预算校验。'
      },
      {
        nodeName: '采购PR',
        systemActionTemplate: 'purchasePrCreate',
        position: 'after',
        targetStageCode: engineeringPlanStage,
        enabledSwitch: 'uncheck',
        description: '按审批后的工程方案创建采购申请。'
      },
      {
        nodeName: '采购PO入库',
        systemActionTemplate: 'purchasePoReceipt',
        position: 'after',
        targetStageCode: engineeringPlanStage,
        enabledSwitch: 'uncheck',
        description: '跟踪采购订单、到货入库和供应状态。'
      },
      {
        nodeName: '库存占用',
        systemActionTemplate: 'inventoryReserve',
        position: 'before',
        targetStageCode: engineeringExecutionStage,
        enabledSwitch: 'uncheck',
        description: '施工排程前完成库存预占用，锁定物料或服务资源。'
      },
      {
        nodeName: 'SAP付款处理',
        systemActionTemplate: 'sapPaymentProcess',
        position: 'after',
        targetStageCode: engineeringAcceptanceStage,
        enabledSwitch: 'uncheck',
        description: '验收后接收完工认证、付款申请、批量复核和最终付款结果。'
      }
    ],
    assetManagement: [
      {
        nodeName: '资产状态同步',
        systemActionTemplate: 'assetStatusSync',
        position: 'after',
        targetStageCode: lastStage,
        enabledSwitch: 'checked',
        description: '资产管理流程完成后同步资产状态和台账记录。'
      }
    ]
  }
  const noDefaultArchiveWorkTypes = ['inspection', 'maintenance', 'repair', 'serviceRequest', 'engineeringChange']
  const withBase = noDefaultArchiveWorkTypes.includes(workTypeCode) ? [] : base
  return [...(map[workTypeCode] || []), ...withBase]
}

function enabledApprovalConfigs(workflow, stageCode, position) {
  return (workflow.approvalConfigs || []).filter(item => item.enabledSwitch === 'checked' && item.targetStageCode === stageCode && item.position === position)
}

function enabledSystemNodeConfigs(workflow, stageCode, position) {
  return (workflow.systemNodeConfigs || []).filter(item => item.enabledSwitch === 'checked' && item.targetStageCode === stageCode && item.position === position)
}

function isCoreStage(item, index, stageNodes, workTypeCode) {
  if (workTypeCode === 'repair') return false
  if (workTypeCode === 'engineeringChange') return isRequiredStage(item, workTypeCode)
  return index === 0 || index === stageNodes.length - 1 || /执行|验收|受理|复核|确认/.test(item.nodeName)
}

function inferStageTemplate(item, workTypeCode) {
  if (item.nodeName.includes('受理') || item.nodeName.includes('分类') || item.nodeName.includes('定性') || item.nodeName.includes('跟踪')) return 'accept'
  if (item.nodeName.includes('分配') || item.nodeName.includes('派工') || item.nodeName.includes('调度')) return 'dispatch'
  if (item.nodeName.includes('诊断') || item.nodeName.includes('评估') || item.nodeName.includes('核实') || item.nodeName.includes('勘查') || item.nodeName.includes('勘察')) return 'diagnosis'
  if (item.nodeName.includes('方案')) return 'plan'
  if (item.nodeName.includes('资源') || item.nodeName.includes('物料')) return 'resource'
  if (item.nodeName.includes('工程维修') && item.nodeType === 'businessFlow') return 'repairSubflow'
  if (item.nodeName.includes('外委') || item.nodeType === 'businessFlow') return 'externalCollaboration'
  if (item.nodeName.includes('验收') || item.nodeName.includes('复核') || item.nodeName.includes('审核')) return 'acceptance'
  if (item.nodeName.includes('回访') || item.nodeName.includes('用户确认') || item.nodeName.includes('用户评价')) return 'userConfirm'
  if (item.nodeName.includes('归档')) return 'archive'
  if (workTypeCode === 'inspection') return 'inspectionExecution'
  if (workTypeCode === 'maintenance') return 'maintenanceExecution'
  if (workTypeCode === 'repair') return 'repairExecution'
  return 'execute'
}

function stageTemplateLabel(value) {
  const map = {
    accept: '受理分类',
    dispatch: '分配调度',
    diagnosis: '诊断评估',
    plan: '方案制定',
    resource: '资源准备',
    repairSubflow: '维修子流程',
    externalCollaboration: '外部协同',
    acceptance: '复核验收',
    userConfirm: '用户确认',
    archive: '归档关闭',
    inspectionExecution: '巡检执行',
    maintenanceExecution: '维保执行',
    repairExecution: '维修执行',
    execute: '执行处理'
  }
  return map[value] || value
}

function generatedRouteLabel(source, target) {
  if (source.nodeType === 'approvalFlow') return '审批通过'
  if (source.nodeType === 'systemTask') return '系统成功'
  if (target.nodeType === 'approvalFlow') return '需审批'
  if (target.nodeType === 'systemTask') return '默认'
  if (target.nodeType === 'end') return '归档完成'
  return '默认'
}

function conditionRule(field, operator, value, relation = 'AND') {
  return {
    id: `cond-${conditionSeq++}`,
    relation,
    field,
    operator,
    value: normalizeConditionValue(field, value)
  }
}

function cloneConditionRules(rules) {
  return rules.map(item => conditionRule(item.field, item.operator, item.value, item.relation))
}

function extractClassificationCode(rules = [], fallback = 'INS-DAY') {
  return firstConditionValue(rules.find(item => item.field === 'classificationCode')?.value) || fallback
}

function defaultNodesForWorkType(workTypeCode) {
  if (workTypeCode === 'engineeringChange') {
    return engineeringDefaultFlowNodes()
  }
  const canonicalSkeleton = canonicalWorkflowSkeleton(workTypeCode)
  if (canonicalSkeleton) return canonicalSkeleton.nodes

  const startName = startNodeNameByWorkType(workTypeCode)
  const endName = endNodeNameByWorkType(workTypeCode)
  const executeNameMap = {
    inspection: '巡检执行',
    maintenance: '维保执行',
    repair: '维修执行',
    serviceRequest: '受理处理',
    engineeringChange: '方案执行',
    assetManagement: '台账复核'
  }
  const pageMap = {
    inspection: 'inspectionExecutionPage',
    maintenance: 'maintenanceExecutionPage',
    repair: 'repairExecutionPage',
    serviceRequest: 'acceptPage',
    engineeringChange: 'planPage',
    assetManagement: 'assetPage'
  }
  return [
    node('start', startName, 'start'),
    node('execute', executeNameMap[workTypeCode] || '执行处理', 'workStage', {
      executionMode: 'singleExecutor',
      pagePolicy: pageMap[workTypeCode] || 'dispatchPage',
      actionSummary: '待配置工作阶段'
    }),
    node('end', endName, 'end')
  ]
}

function engineeringDefaultFlowNodes() {
  return [
    node('start', '创建', 'start'),
    node('plan', '方案制定', 'workStage', {
      stageTemplate: 'plan',
      executionMode: 'singleExecutor',
      pagePolicy: 'planPage',
      executorSource: 'creator',
      fallbackExecutor: 'projectManager',
      actionSummary: '制定工程改造范围、施工方案、预算口径、风险约束和审批资料。'
    }),
    node('engineeringExecution', '改造执行', 'workStage', {
      stageTemplate: 'execute',
      executionMode: 'multiExecutorAll',
      pagePolicy: 'repairExecutionPage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'projectManager',
      assignmentEnabledSwitch: 'uncheck',
      assignmentMode: 'system',
      assignmentTargetType: 'role',
      assignmentTarget: 'projectManager',
      actionSummary: '执行现场改造、记录进度、问题、变更、照片和安全措施。'
    }),
    node('engineeringAcceptance', '改造验收', 'workStage', {
      stageTemplate: 'acceptance',
      executionMode: 'singleExecutor',
      pagePolicy: 'acceptancePage',
      executorSource: 'fixedRole',
      fallbackExecutor: 'engineeringSupervisor',
      rejectTargetNodeCode: 'engineeringExecution',
      actionSummary: '按方案和验收标准确认改造结果、资料、整改项和签字。'
    }),
    node('end', '归档关闭', 'end')
  ]
}

function defaultRouteLabelsForWorkType(workTypeCode) {
  if (workTypeCode === 'engineeringChange') return ['创建提交', '方案制定完成', '改造执行完成', '改造验收通过']
  const canonicalSkeleton = canonicalWorkflowSkeleton(workTypeCode)
  if (canonicalSkeleton?.routeLabels) return canonicalSkeleton.routeLabels
  return ['默认', '处理完成']
}

function defaultRoutesForWorkType(workTypeCode) {
  if (workTypeCode !== 'serviceRequest') return []
  return [
    workflowRoute('start', 'serviceQualify', '创建后进入报事报修定性'),
    workflowRoute('serviceQualify', 'engineeringRepairFlow', '报事报修分类=工程维修', 'completed', [
      conditionRule('serviceRequestCategory', 'eq', '工程维修')
    ]),
    workflowRoute('serviceQualify', 'nonEngineeringHandle', '报事报修分类!=工程维修', 'completed', [
      conditionRule('serviceRequestCategory', 'neq', '工程维修')
    ]),
    workflowRoute('engineeringRepairFlow', 'resultAcceptance', '工程维修完成'),
    workflowRoute('nonEngineeringHandle', 'resultAcceptance', '非工程处置完成'),
    workflowRoute('resultAcceptance', 'userEvaluation', '验收通过'),
    workflowRoute('userEvaluation', 'end', '评价完成')
  ]
}

function canonicalWorkflowSkeleton(workTypeCode) {
  const skeletonMap = {
    inspection: {
      nodes: [
        node('start', '创建', 'start'),
        node('inspectionExecute', '巡检执行', 'workStage', {
          executionMode: 'candidateAnyOne',
          pagePolicy: 'inspectionExecutionPage',
          actionSummary: '打卡、记录巡检项、登记异常、提交巡检结果'
        }),
        node('end', '归档关闭', 'end')
      ],
      routeLabels: ['创建完成', '巡检执行完成']
    },
    maintenance: {
      nodes: [
        node('start', '创建', 'start'),
        node('maintenanceExecute', '维保执行', 'workStage', {
          executionMode: 'multiExecutorAll',
          pagePolicy: 'maintenanceExecutionPage',
          actionSummary: '执行维保作业、记录参数、上传报告'
        }),
        node('maintenanceAcceptance', '维保验收', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'acceptancePage',
          actionSummary: '验收维保结果、确认整改或关闭'
        }),
        node('end', '归档关闭', 'end')
      ],
      routeLabels: ['创建完成', '维保执行完成', '维保验收通过']
    },
    repair: {
      nodes: [
        node('start', '创建', 'start'),
        node('exceptionVerify', '异常核实', 'workStage', {
          executionMode: 'candidateAnyOne',
          pagePolicy: 'repairDiagnosisPage',
          actionSummary: '核实异常真实性、影响范围和紧急程度'
        }),
        node('diagnosis', '排查诊断', 'workStage', {
          executionMode: 'multiExecutorAll',
          pagePolicy: 'repairDiagnosisPage',
          actionSummary: '排查故障原因、定位问题对象和处理路径'
        }),
        node('repairPlan', '维修方案制定', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'planPage',
          actionSummary: '制定维修方案、资源需求、停机窗口和风险措施'
        }),
        node('repairExecution', '维修执行', 'workStage', {
          executionMode: 'multiExecutorAnyOne',
          pagePolicy: 'repairExecutionPage',
          actionSummary: '执行维修处理并验证恢复结果'
        }),
        node('repairAcceptance', '维修验收', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'acceptancePage',
          actionSummary: '验收维修结果、确认返工或关闭'
        }),
        node('end', '归档关闭', 'end')
      ],
      routeLabels: ['创建完成', '异常核实完成', '排查诊断完成', '维修方案制定完成', '维修执行完成', '维修验收通过']
    },
    serviceRequest: {
      nodes: [
        node('start', '创建', 'start'),
        node('serviceQualify', '报事报修定性', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'acceptPage',
          actionSummary: '判断报事报修性质、责任部门、是否属于工程维修'
        }),
        node('engineeringRepairFlow', '工程维修', 'businessFlow', {
          pagePolicy: 'repairExecutionPage',
          actionSummary: '外挂工程维修业务流程，接收维修处理结果回传'
        }),
        node('nonEngineeringHandle', '非工程处置', 'workStage', {
          executionMode: 'candidateAnyOne',
          pagePolicy: 'acceptPage',
          actionSummary: '处理咨询、投诉、协调、秩序、环境等非工程维修类报事'
        }),
        node('resultAcceptance', '结果验收', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'acceptancePage',
          actionSummary: '验收报事报修处理结果、确认是否需要补充处理或退回'
        }),
        node('userEvaluation', '用户评价', 'workStage', {
          executionMode: 'singleExecutor',
          pagePolicy: 'callbackPage',
          actionSummary: '记录用户评价、满意度和补充反馈'
        }),
        node('end', '归档关闭', 'end')
      ],
      routeLabels: ['创建完成', '完成定性', '工程维修完成', '非工程处置完成', '验收通过', '评价完成']
    },
    engineeringChange: {
      nodes: engineeringDefaultFlowNodes(),
      routeLabels: defaultRouteLabelsForWorkType('engineeringChange')
    }
  }
  return skeletonMap[workTypeCode] || null
}

function defaultConditionRules(classificationCode, summary = '') {
  const rules = [conditionRule('classificationCode', 'eq', classificationCode)]
  const normalized = summary.replace(/\s/g, '')
  const add = (field, value) => rules.push(conditionRule(field, 'eq', value, 'AND'))
  if (normalized.includes('业务分类=暖通')) add('businessCategory', '暖通')
  if (normalized.includes('业务分类=强电')) add('businessCategory', '强电')
  if (normalized.includes('业务分类=给排水')) add('businessCategory', '给排水')
  if (normalized.includes('业务分类=消防')) add('businessCategory', '消防')
  if (normalized.includes('设备专业=电梯')) add('assetMajor', '电梯')
  if (normalized.includes('设备专业=消防')) add('assetMajor', '消防')
  if (normalized.includes('设备专业=高压配电')) add('assetMajor', '高压配电')
  if (normalized.includes('设备专业=暖通')) add('assetMajor', '暖通')
  if (normalized.includes('风险等级=高')) add('riskLevel', '高')
  if (normalized.includes('来源类型=用户报事')) add('sourceType', '用户报事')
  if (normalized.includes('季节=供冷切换')) add('season', '供冷切换')
  if (normalized.includes('预算级别=小额')) add('budgetLevel', '小额')
  if (normalized.includes('预算金额>=阈值')) rules.push(conditionRule('budgetLevel', 'gte', '大额', 'AND'))
  if (normalized.includes('外委方式=框架合同')) add('contractMode', '框架合同')
  if (normalized.includes('外委方式=单次采购')) add('contractMode', '单次采购')
  if (normalized.includes('资产状态=停用')) add('assetStatus', '停用')
  if (normalized.includes('巡检计划=公共区日常巡检计划')) add('inspectionPlan', 'IP-DAY-PUBLIC')
  if (normalized.includes('巡检计划=设备房巡检计划')) add('inspectionPlan', 'IP-ROOM-POWER')
  if (normalized.includes('巡检计划=暖通系统巡检计划')) add('inspectionPlan', 'IP-SYSTEM-HVAC')
  if (normalized.includes('巡检计划=外委巡检计划')) add('inspectionPlan', 'IP-OUT-VENDOR')
  if (normalized.includes('巡检计划=消防安全巡检计划')) add('inspectionPlan', 'IP-FIRE-SAFETY')
  if (normalized.includes('巡检计划=临时专项巡检计划')) add('inspectionPlan', 'IP-TEMP-SPECIAL')
  return rules
}

function conditionText(workflow) {
  if (Array.isArray(workflow?.conditionRules) && workflow.conditionRules.length === 0) return '默认流程'
  return summarizeConditionRules(workflow?.conditionRules || []) || workflow?.conditionSummary || '默认流程'
}

function summarizeConditionRules(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return ''
  return rules.filter(isConditionRuleComplete).map((rule, index) => {
    const relation = index === 0 ? '' : `${relationLabel(rule.relation)} `
    return `${relation}${conditionFieldLabel(rule.field)} ${conditionOperatorLabel(rule.operator)} ${conditionValueLabel(rule.field, rule.value)}`
  }).join(' ')
}

function addConditionRuleAfter(index, target = selectedWorkflow.value, markDirty = true) {
  const field = defaultConditionField(target)
  target.conditionRules.splice(index + 1, 0, conditionRule(field, '', emptyConditionValue(field, target), 'AND'))
  syncWorkflowByConditions(target, markDirty)
}

function removeConditionRule(index, target = selectedWorkflow.value, markDirty = true) {
  target.conditionRules.splice(index, 1)
  syncWorkflowByConditions(target, markDirty)
}

function changeConditionField(rule, target = selectedWorkflow.value, markDirty = true) {
  rule.operator = ''
  rule.value = emptyConditionValue(rule.field, target)
  syncWorkflowByConditions(target, markDirty)
}

function changeConditionValue(rule, target = selectedWorkflow.value, markDirty = true) {
  syncWorkflowByConditions(target, markDirty)
}

function syncWorkflowByConditions(target, markDirty = true) {
  target.conditionSummary = conditionText(target)
  if (target === selectedWorkflow.value) {
    const classificationCode = extractClassificationCode(target.conditionRules, target.classificationCode)
    const workTypeCode = classificationCode ? classificationWorkType(classificationCode) : target.workTypeCode
    const workTypeChanged = target.workTypeCode !== workTypeCode
    if (classificationCode) target.classificationCode = classificationCode
    target.workTypeCode = workTypeCode
    target.businessObjectType = businessObjectTypeByWorkType(workTypeCode)
    if (workTypeChanged) {
      const nextBaseNodes = cloneWorkflowNodes(defaultNodesForWorkType(workTypeCode), workTypeCode)
      target.baseNodes = nextBaseNodes
      target.nodes = cloneWorkflowNodes(nextBaseNodes, workTypeCode)
      target.stageStrategies = buildStageStrategies(nextBaseNodes, classificationCode)
      target.approvalConfigs = buildApprovalConfigs(nextBaseNodes, classificationCode, target.stageStrategies)
      target.systemNodeConfigs = buildSystemNodeConfigs(nextBaseNodes, workTypeCode, target.stageStrategies)
      target.statusDefinitions = []
      target.statusTransitionRules = null
    }
    normalizeWorkflowStatusSettings(target)
  } else {
    const classificationCode = extractClassificationCode(target.conditionRules, target.classificationCode)
    if (classificationCode) {
      target.classificationCode = classificationCode
      target.workTypeCode = classificationWorkType(classificationCode) || target.workTypeCode
    }
  }
  if (markDirty) markStrategyDirty()
}

function conditionFieldOptionsFor(target) {
  return workTypeForConditionTarget(target) === 'inspection' ? inspectionConditionFieldOptions : conditionFieldOptions
}

function conditionValueOptions(field, target) {
  if (field === 'classificationCode') return target ? classificationOptionsFor(target) : classificationOptions
  return conditionValueMap[field] || []
}

function normalizeConditionValue(field, value) {
  if ((conditionValueMap[field] || []).length === 0) return Array.isArray(value) ? value.join('、') : value
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function firstConditionValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function isEmptyConditionValue(value) {
  return Array.isArray(value) ? value.length === 0 : value === '' || value === undefined || value === null
}

function isConditionRuleComplete(rule) {
  return !!rule?.field && !!rule?.operator && !isEmptyConditionValue(rule.value)
}

function workTypeForConditionTarget(target) {
  const classificationCode = firstConditionValue(target?.conditionRules?.find(item => item.field === 'classificationCode')?.value)
  if (classificationCode) return classificationWorkType(classificationCode)
  if (target && Object.prototype.hasOwnProperty.call(target, 'workTypeCode')) return target.workTypeCode || ''
  return selectedWorkflow.value?.workTypeCode || 'inspection'
}

function classificationOptionsFor(target) {
  const workTypeCode = workTypeForConditionTarget(target)
  return workTypeCode ? classificationOptions.filter(item => item.workTypeCode === workTypeCode) : classificationOptions
}

function defaultConditionField(target) {
  return conditionFieldOptionsFor(target)[0]?.value || 'classificationCode'
}

function emptyConditionValue(field, target) {
  return conditionValueOptions(field, target).length > 0 ? [] : ''
}

function workflowClassificationValues(workflow) {
  const value = workflow?.conditionRules?.find(item => item.field === 'classificationCode')?.value
  if (Array.isArray(value) && value.length > 0) return value
  if (value) return [value]
  return workflow?.classificationCode ? [workflow.classificationCode] : []
}

function conditionFieldLabel(value) {
  return [...conditionFieldOptions, inspectionPlanConditionFieldOption].find(item => item.value === value)?.label || value
}

function conditionOperatorLabel(value) {
  const operatorMap = {
    eq: '=',
    neq: '!=',
    contains: '包含',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<='
  }
  return operatorMap[value] || value
}

function conditionValueLabel(field, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return '未选择'
    return value
      .map(item => conditionValueOptions(field).find(option => option.value === item)?.label || item)
      .join(' 或 ')
  }
  return conditionValueOptions(field).find(item => item.value === value)?.label || value
}

function relationLabel(value) {
  return value === 'OR' ? '或' : '且'
}

function createEmptyNodeDetail() {
  return {
    ...initialNodeDetail,
    actionPolicies: defaultActionPolicies(''),
    actionPolicyApprovalFlows: { ...blankActionPolicyApprovalFlows },
    executionPageDataPermissions: normalizeDataPermissions({}, initialNodeDetail, selectedWorkflow.value),
    customDataItems: [],
    allowRejectSwitch: 'uncheck',
    rejectTargetNodeCode: '',
    executorSourceNodeCode: '',
    executorPerson: 'u-zhang-wei',
    statusOutputOptions: decorateStatusOutputOptions(normalizeStatusOutputOptionsForNode(initialNodeDetail, initialNodeDetail.statusOutputOptions)),
    entryLogicMode: 'all',
    entryRules: [],
    routeRules: [],
    actionSummary: ''
  }
}

function stageStrategyForNode(item) {
  if (!item?.nodeCode) return null
  return (selectedWorkflow.value.stageStrategies || []).find(stage => stage.stageCode === item.nodeCode) || null
}

function createNodeDetail(item) {
  const actionPolicies = {
    ...defaultActionPolicies(item.actionSummary || ''),
    ...(item.actionPolicies || {})
  }
  const stage = stageStrategyForNode(item)
  const outgoingRules = editableOutgoingRouteRules(item)
  const incomingRules = editableIncomingRouteRules(item)
  const rejectRule = outgoingRules.find(rule => rule.sourceStatus === 'rejected')
  const rejectTargetNodeCode = rejectRule?.targetNodeCode || item.rejectTargetNodeCode || defaultRejectTargetNodeCode(item)
  return {
    ...createEmptyNodeDetail(),
    ...item,
    stageTemplate: stage?.stageTemplate || item.stageTemplate || inferStageTemplate(item, selectedWorkflow.value.workTypeCode),
    assignmentEnabledSwitch: stage?.assignmentEnabledSwitch || item.assignmentEnabledSwitch || 'uncheck',
    assignmentMode: stage?.assignmentMode || item.assignmentMode || 'system',
    executorSource: normalizeExecutorSourceForNode(item, stage),
    assignmentTargetType: stage?.assignmentTargetType || item.assignmentTargetType || 'role',
    assignmentTarget: stage?.assignmentTarget || item.assignmentTarget || 'operationDispatcher',
    executorSourceNodeCode: item.executorSourceNodeCode || '',
    executorPerson: item.executorPerson || 'u-zhang-wei',
    entryLogicMode: entryLogicModeForTarget(item, incomingRules),
    entryRules: incomingRules,
    routeRules: outgoingRules,
    actionPolicies,
    actionPolicyApprovalFlows: {
      ...defaultActionPolicyApprovalFlows(actionPolicies, selectedWorkflow.value.workTypeCode),
      ...(item.actionPolicyApprovalFlows || {})
    },
    executionPageDataPermissions: normalizeDataPermissions(item.executionPageDataPermissions, item, selectedWorkflow.value),
    customStage: item.customStage === true || stage?.customStage === true,
    customDataItems: normalizeCustomDataItems(item.customDataItems || []),
    allowRejectSwitch: item.allowRejectSwitch || (rejectRule ? 'checked' : 'uncheck'),
    rejectTargetNodeCode,
    statusOutputOptions: decorateStatusOutputOptions(normalizeStatusOutputOptionsForNode(item, item.statusOutputOptions))
  }
}

function saveNodeDetail() {
  if (!persistNodeDetailDraft()) return
  rebuildWorkflowByStrategies(selectedWorkflow.value)
  routeWarning.value = false
  strategyDirty.value = false
  closeNodeDetail()
  persistWorkflows()
  saveMessage.value = '节点详情、执行规则、数据权限与进入条件已保存，流程图已自动更新。'
  showToast(saveMessage.value)
}

function persistNodeDetailDraft() {
  if (!selectedNode.value) return true
  const executorSource = normalizeExecutorSourceForNode(nodeDetailForm.value)
  const nextDetail = {
    nodeName: nodeDetailForm.value.nodeName,
    stageTemplate: nodeDetailForm.value.stageTemplate,
    pagePolicy: nodeDetailForm.value.pagePolicy,
    slaPolicy: nodeDetailForm.value.slaPolicy,
    executionMode: nodeDetailForm.value.executionMode,
    executorSource,
    executorSourceNodeCode: nodeDetailForm.value.executorSourceNodeCode,
    executorPerson: nodeDetailForm.value.executorPerson,
    fallbackExecutor: nodeDetailForm.value.fallbackExecutor,
    assignmentEnabledSwitch: nodeDetailForm.value.assignmentEnabledSwitch,
    assignmentMode: nodeDetailForm.value.assignmentMode,
    assignmentTargetType: nodeDetailForm.value.assignmentTargetType,
    assignmentTarget: nodeDetailForm.value.assignmentTarget,
    approvalFlow: nodeDetailForm.value.approvalFlow,
    rejectPolicy: nodeDetailForm.value.rejectPolicy,
    systemActionFailure: nodeDetailForm.value.systemActionFailure,
    notifyTarget: nodeDetailForm.value.notifyTarget,
    actionPolicies: { ...nodeDetailForm.value.actionPolicies },
    actionPolicyApprovalFlows: { ...nodeDetailForm.value.actionPolicyApprovalFlows },
    executionPageDataPermissions: normalizeDataPermissions(nodeDetailForm.value.executionPageDataPermissions, nodeDetailForm.value, selectedWorkflow.value),
    customStage: nodeDetailForm.value.customStage === true,
    customDataItems: normalizeCustomDataItems(nodeDetailForm.value.customDataItems || []),
    allowRejectSwitch: nodeDetailForm.value.allowRejectSwitch,
    rejectTargetNodeCode: currentRejectTargetNodeCode(),
    actionSummary: nodeDetailForm.value.actionSummary || actionPolicySummary(nodeDetailForm.value.actionPolicies),
    statusOutputOptions: normalizeStatusOutputOptionsForNode(nodeDetailForm.value, nodeDetailForm.value.statusOutputOptions)
  }
  Object.assign(selectedNode.value, nextDetail)
  const baseNode = ensureBaseNodes(selectedWorkflow.value).find(item => item.nodeCode === selectedNode.value.nodeCode)
  if (baseNode) Object.assign(baseNode, nextDetail)
  const stage = selectedWorkflow.value.stageStrategies.find(item => item.stageCode === selectedNode.value.nodeCode)
  if (stage) {
    stage.stageName = nodeDetailForm.value.nodeName
    stage.stageTemplate = nodeDetailForm.value.stageTemplate || stage.stageTemplate
    stage.assignmentEnabledSwitch = nodeDetailForm.value.assignmentEnabledSwitch || 'uncheck'
    stage.assignmentMode = nodeDetailForm.value.assignmentMode || 'system'
    stage.assignmentTargetType = nodeDetailForm.value.assignmentTargetType || 'role'
    stage.assignmentTarget = nodeDetailForm.value.assignmentTarget || 'operationDispatcher'
  }
  syncGeneratedDispatchDetailToStage(selectedNode.value, nextDetail)
  syncSystemNodeConfigFromDetail(selectedNode.value, nextDetail)
  syncApprovalConfigFromDetail(selectedNode.value, nextDetail)
  applyNodeEntryRules(nodeDetailForm.value.entryRules)
  return true
}

function syncGeneratedDispatchDetailToStage(nodeLike, detail) {
  if (nodeLike?.nodeType !== 'dispatchFlow' || !isGeneratedScheduleNode(nodeLike)) return
  const ownerStageCode = scheduleOwnerStageCode(nodeLike.nodeCode)
  const stage = selectedWorkflow.value.stageStrategies.find(item => item.stageCode === ownerStageCode)
  if (!stage) return
  stage.dispatchExecutorSource = detail.executorSource || 'fixedRole'
  stage.dispatchFallbackExecutor = detail.fallbackExecutor || 'operationDispatcher'
  stage.dispatchExecutorPerson = detail.executorPerson || 'u-zhang-wei'
  stage.dispatchActionPolicies = { ...(detail.actionPolicies || {}) }
  stage.dispatchActionPolicyApprovalFlows = { ...(detail.actionPolicyApprovalFlows || {}) }
  stage.dispatchActionSummary = detail.actionSummary || ''
}

function syncApprovalConfigFromDetail(nodeLike, detail) {
  if (nodeLike?.nodeType !== 'approvalFlow') return
  const config = (selectedWorkflow.value.approvalConfigs || []).find(item => item.id === nodeLike.approvalConfigId)
  if (!config) return
  config.approvalNodeName = detail.nodeName || config.approvalNodeName
  config.approvalFlow = detail.approvalFlow || config.approvalFlow
  config.rejectPolicy = detail.rejectPolicy || config.rejectPolicy
  config.executionPageDataPermissions = normalizeDataPermissions(detail.executionPageDataPermissions, detail, selectedWorkflow.value)
}

function syncSystemNodeConfigFromDetail(nodeLike, detail) {
  if (nodeLike?.nodeType !== 'systemTask') return
  const config = (selectedWorkflow.value.systemNodeConfigs || []).find(item =>
    item.id === nodeLike.systemConfigId
    || (
      item.systemActionTemplate === nodeLike.systemActionTemplate
      && (!nodeLike.targetStageCode || item.targetStageCode === nodeLike.targetStageCode)
      && (!nodeLike.position || item.position === nodeLike.position)
    )
  )
  if (!config) return
  config.nodeName = detail.nodeName
  config.pagePolicy = detail.pagePolicy || config.pagePolicy
  config.systemActionFailure = detail.systemActionFailure || config.systemActionFailure
  config.notifyTarget = detail.notifyTarget || config.notifyTarget
  config.statusOutputOptions = cloneStatusOutputOptions(detail.statusOutputOptions)
}

function refreshOpenNodeDetailAfterRebuild() {
  if (selectedElement.value?.type !== 'node') return
  const refreshedNode = selectedWorkflow.value.nodes.find(item => item.nodeCode === selectedElement.value.id)
  if (!refreshedNode) {
    closeNodeDetail()
    selectWholeWorkflow()
    return
  }
  selectedNode.value = refreshedNode
  selectedElement.value = { type: 'node', id: refreshedNode.nodeCode, data: refreshedNode }
  nodeDetailForm.value = createNodeDetail(refreshedNode)
}

function defaultActionPolicies(summary = '') {
  return actionPolicyOptions.reduce((result, item) => {
    result[item.value] = summary.includes(item.label.replace('申请', '')) ? 'checked' : 'uncheck'
    return result
  }, {})
}

function defaultActionPolicyApprovalFlows(policies = {}, workTypeCode = 'repair') {
  return Object.keys(blankActionPolicyApprovalFlows).reduce((result, key) => {
    result[key] = policies[key] === 'checked' ? approvalFlowByWorkType(workTypeCode) : ''
    return result
  }, {})
}

function actionPolicySummary(policies) {
  const selected = actionPolicyOptions
    .filter(item => policies?.[item.value] === 'checked')
    .map(item => item.label)
  return selected.length > 0 ? selected.join('、') : '未开放额外操作能力'
}

function actionPolicyLabel(value) {
  return actionPolicyOptions.find(item => item.value === value)?.label || value
}

function isExecutorConfigVisible(nodeLike) {
  return !!nodeLike && ['workStage', 'businessFlow', 'dispatchFlow'].includes(nodeLike.nodeType)
}

function isExecutionRuleVisible(nodeLike) {
  return isExecutorConfigVisible(nodeLike)
}

function isExecutionCapabilityVisible(nodeLike) {
  return isExecutorConfigVisible(nodeLike)
}

function isExecutionResultConfigVisible(nodeLike) {
  return !!nodeLike
}

function isDataPermissionConfigVisible(nodeLike) {
  return !!nodeLike && !['systemTask', 'start', 'end'].includes(nodeLike.nodeType)
}

function isCustomStageNode(nodeLike) {
  if (!nodeLike || nodeLike.nodeType !== 'workStage') return false
  if (nodeLike.customStage === true) return true
  return (selectedWorkflow.value.stageStrategies || []).some(stage => stage.stageCode === nodeLike.nodeCode && isCustomStageStrategy(stage))
}

function isCustomDataItemConfigVisible(nodeLike) {
  return isCustomStageNode(nodeLike)
}

function isCustomApprovalConfig(config) {
  return !!config && (config.customApproval === true || !config.nodeCode)
}

function isCustomDiagramNode(nodeLike) {
  if (!nodeLike) return false
  return nodeLike.customStage === true || nodeLike.customApproval === true
}

function canConfigureNodeAssignment(nodeLike) {
  return !!nodeLike && ['workStage', 'businessFlow'].includes(nodeLike.nodeType) && nodeLike.stageTemplate !== 'dispatch'
}

function canConfigureExecutorSource(nodeLike) {
  return isExecutorConfigVisible(nodeLike)
}

function executorSourceOptionsForNode(nodeLike) {
  if (nodeLike?.assignmentEnabledSwitch === 'checked' && canConfigureNodeAssignment(nodeLike)) return inheritedDispatchExecutorSourceOptions
  if (nodeLike?.nodeType === 'dispatchFlow') return dispatchNodeExecutorSourceOptions
  return executorSourceOptions
}

function normalizeExecutorSourceForNode(nodeLike, stage = null) {
  const source = nodeLike?.executorSource || ''
  const assignmentEnabled = stage?.assignmentEnabledSwitch || nodeLike?.assignmentEnabledSwitch
  if (assignmentEnabled === 'checked' && nodeLike?.nodeType !== 'dispatchFlow') return 'inheritDispatch'
  const options = nodeLike?.nodeType === 'dispatchFlow' ? dispatchNodeExecutorSourceOptions : executorSourceOptions
  return options.some(option => option.value === source) ? source : options[0]?.value || 'creator'
}

function isDataPermissionOptionDisabled(group, value) {
  return group.readonlyOnly && value === 'editable'
}

function dataPermissionOptionsForGroup(group) {
  return dataPermissionOptions.filter(option => !isDataPermissionOptionDisabled(group, option.value))
}

function dataPermissionGroupsByMode(mode) {
  return dataPermissionGroupsForWorkflow(selectedWorkflow.value)
    .filter(group => nodeDetailForm.value.executionPageDataPermissions[group.value] === mode)
}

function dataPermissionMoveOptions(group, currentValue) {
  return dataPermissionOptionsForGroup(group).filter(option => option.value !== currentValue)
}

function selectNodeDataPermission(groupValue, value) {
  const group = dataPermissionGroupsForWorkflow(selectedWorkflow.value).find(item => item.value === groupValue)
  if (!group || isDataPermissionOptionDisabled(group, value)) return
  nodeDetailForm.value.executionPageDataPermissions[groupValue] = normalizeDataPermissionValue(group, value)
}

function addCustomDataItem() {
  const items = nodeDetailForm.value.customDataItems || []
  nodeDetailForm.value.customDataItems = [...items, createCustomDataItem(items.length)]
}

function removeCustomDataItem(index) {
  nodeDetailForm.value.customDataItems.splice(index, 1)
}

function changeExecutorSource() {
  if (nodeDetailForm.value.executorSource === 'specifiedNodeExecutor') {
    nodeDetailForm.value.executorSourceNodeCode = nodeDetailForm.value.executorSourceNodeCode || executorSourceNodeOptions.value[0]?.value || ''
    return
  }
  nodeDetailForm.value.executorSourceNodeCode = ''
  if (nodeDetailForm.value.executorSource === 'fixedRole') {
    nodeDetailForm.value.fallbackExecutor = nodeDetailForm.value.fallbackExecutor || assignmentRoleOptions[0]?.value || ''
  }
  if (nodeDetailForm.value.executorSource === 'manualSelect') {
    nodeDetailForm.value.executorPerson = nodeDetailForm.value.executorPerson || assignmentPersonOptions[0]?.value || ''
  }
}

function isPresetExecutionResultOption(option) {
  return option?._preset === true
}

function canAddExecutionResultOption(nodeLike) {
  return !!nodeLike && nodeLike.nodeType !== 'systemTask'
}

function addExecutionResultOption() {
  if (!canAddExecutionResultOption(nodeDetailForm.value)) return
  const options = normalizeStatusOutputOptionsForNode(nodeDetailForm.value, nodeDetailForm.value.statusOutputOptions)
  const usedCodes = new Set(options.map(item => item.value))
  let nextIndex = options.length + 1
  let nextCode = `customResult${nextIndex}`
  while (usedCodes.has(nextCode)) {
    nextIndex += 1
    nextCode = `customResult${nextIndex}`
  }
  nodeDetailForm.value.statusOutputOptions = decorateStatusOutputOptions([
    ...options,
    { value: nextCode, label: `其他结果${nextIndex}` }
  ])
}

function removeExecutionResultOption(index) {
  const option = nodeDetailForm.value.statusOutputOptions[index]
  if (!option || isPresetExecutionResultOption(option)) return
  const nextStatus = defaultRouteStatusForNode(nodeDetailForm.value)
  nodeDetailForm.value.statusOutputOptions.splice(index, 1)
  nodeDetailForm.value.routeRules.forEach(rule => {
    if (rule.sourceStatus === option.value) rule.sourceStatus = nextStatus
  })
  updateRouteSourceStatus(nodeDetailForm.value.nodeCode, option.value, nextStatus)
  updateStatusRuleConditionOutput(nodeDetailForm.value.nodeCode, option.value, nextStatus)
}

function changeExecutionResultCode(option) {
  if (!option || isPresetExecutionResultOption(option)) return
  const previousValue = option._previousValue || ''
  const nextValue = String(option.value || '').trim()
  if (!nextValue) return
  if (previousValue && previousValue !== nextValue) {
    nodeDetailForm.value.routeRules.forEach(rule => {
      if (rule.sourceStatus === previousValue) rule.sourceStatus = nextValue
    })
    updateRouteSourceStatus(nodeDetailForm.value.nodeCode, previousValue, nextValue)
    updateStatusRuleConditionOutput(nodeDetailForm.value.nodeCode, previousValue, nextValue)
  }
  option.value = nextValue
  option._previousValue = nextValue
}

function updateRouteSourceStatus(nodeCode, previousValue, nextValue) {
  if (!nodeCode || !previousValue || !nextValue) return
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === nodeCode) || nodeDetailForm.value
  const updateRoute = route => {
    if (!route || route.sourceNodeCode !== nodeCode) return route
    const currentStatus = route.sourceStatus || normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || [], source)
    if (currentStatus !== previousValue) return route
    route.sourceStatus = nextValue
    route.routeType = routeTypeForStatus(source, nextValue)
    route.conditionSummary = outputResultLabel(source, nextValue)
    return route
  }
  ;(selectedWorkflow.value.routes || []).forEach(updateRoute)
  ;(selectedWorkflow.value.routeConditionRules || []).forEach(updateRoute)
  ;(selectedWorkflow.value.disabledRouteRules || []).forEach(updateRoute)
  nodeDetailForm.value.entryRules.forEach(rule => {
    if (rule.sourceNodeCode === nodeCode && rule.sourceStatus === previousValue) {
      rule.sourceStatus = nextValue
      rule.routeType = routeTypeForStatus(source, nextValue)
    }
  })
}

function updateStatusRuleConditionOutput(nodeCode, previousValue, nextValue) {
  if (!nodeCode || !previousValue || !nextValue) return
  ;(selectedWorkflow.value.statusTransitionRules || []).forEach(rule => {
    ;(rule.conditions || []).forEach(condition => {
      if (condition.nodeCode === nodeCode && condition.outputResult === previousValue) {
        condition.outputResult = nextValue
      }
    })
  })
}

function requiresActionPolicyApproval(value) {
  return ['requestAddExecutor', 'requestReplaceExecutor', 'requestDelay', 'requestTerminate'].includes(value)
}

function changeActionPolicySwitch(value) {
  if (!requiresActionPolicyApproval(value)) return
  if (nodeDetailForm.value.actionPolicies[value] === 'checked') {
    nodeDetailForm.value.actionPolicyApprovalFlows[value] = nodeDetailForm.value.actionPolicyApprovalFlows[value] || approvalFlowByWorkType(selectedWorkflow.value.workTypeCode)
  } else {
    nodeDetailForm.value.actionPolicyApprovalFlows[value] = ''
  }
}

function executionRequirementDescription(value) {
  const map = {
    requestAddExecutor: '允许执行过程中申请增加协作人员。',
    requestReplaceExecutor: '允许执行过程中申请更换当前执行人。',
    requestMaterial: '允许执行过程中申请领用备件、耗材或工具。',
    requestDelay: '允许执行过程中申请延长节点处理时限。',
    requestTerminate: '允许执行过程中申请终止当前流程。'
  }
  return map[value] || ''
}

function editableOutgoingRouteRules(nodeLike) {
  if (!nodeLike?.nodeCode || nodeLike.nodeType === 'end') return []
  const routes = normalizeRoutes(selectedWorkflow.value.routes || [], selectedWorkflow.value.nodes || [])
    .filter(route => route.sourceNodeCode === nodeLike.nodeCode)
  return routes.map((route, index) => routeToEditableRule(route, nodeLike, index))
}

function editableIncomingRouteRules(nodeLike) {
  if (!nodeLike?.nodeCode) return []
  const routes = normalizeRoutes(selectedWorkflow.value.routes || [], selectedWorkflow.value.nodes || [])
    .filter(route => route.targetNodeCode === nodeLike.nodeCode)
  return routes.map((route, index) => routeToEditableEntryRule(route, nodeLike, index))
}

function routeToEditableRule(route, nodeLike, index) {
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === route.sourceNodeCode) || nodeLike
  const normalized = normalizeRoute(route, selectedWorkflow.value.nodes || [])
  return {
    id: `${normalized.sourceNodeCode}-${normalized.targetNodeCode}-${normalized.sourceStatus || 'completed'}-${index}-${Date.now()}`,
    originalRouteKey: routeConditionRuleKey(normalized),
    routeType: normalized.routeType || 'default',
    sourceNodeCode: normalized.sourceNodeCode,
    targetNodeCode: normalized.targetNodeCode,
    sourceStatus: normalized.sourceStatus,
    sourceNodeName: source?.nodeName || nodeName(normalized.sourceNodeCode),
    targetNodeName: nodeName(normalized.targetNodeCode),
    editable: true,
    generatedHint: '',
    entryConfigured: normalized.entryConfigured === true,
    entryLogicMode: normalized.entryLogicMode || '',
    conditions: cloneEditableRouteConditions(normalized.extraConditions)
  }
}

function routeToEditableEntryRule(route, targetNode, index) {
  const nodes = selectedWorkflow.value.nodes || []
  const normalized = normalizeRoute(route, nodes)
  const source = nodes.find(item => item.nodeCode === normalized.sourceNodeCode)
  return {
    id: `entry-${normalized.sourceNodeCode}-${normalized.targetNodeCode}-${normalized.sourceStatus || 'completed'}-${index}-${Date.now()}`,
    originalRouteKey: routeConditionRuleKey(normalized),
    routeType: normalized.routeType || 'default',
    sourceNodeCode: normalized.sourceNodeCode,
    targetNodeCode: targetNode.nodeCode,
    sourceStatus: normalized.sourceStatus,
    sourceNodeName: source?.nodeName || nodeName(normalized.sourceNodeCode),
    targetNodeName: targetNode.nodeName || nodeName(targetNode.nodeCode),
    editable: true,
    generatedHint: '',
    entryConfigured: normalized.entryConfigured === true,
    entryLogicMode: normalized.entryLogicMode || '',
    conditions: cloneEditableRouteConditions(normalized.extraConditions)
  }
}

function entryLogicModeForTarget(nodeLike, incomingRules = []) {
  const incomingRoutes = normalizeRoutes(selectedWorkflow.value.routes || [], selectedWorkflow.value.nodes || [])
    .filter(route => route.targetNodeCode === nodeLike?.nodeCode)
  const configuredMode = incomingRoutes.find(route => ['all', 'any'].includes(route.entryLogicMode))?.entryLogicMode
  if (configuredMode) return configuredMode
  return incomingRules.length > 1 ? 'any' : 'all'
}

function isGeneratedScheduleNode(item) {
  return !!item
    && item.nodeStatus === 'generated'
    && ['AI排程派工', '人工排程派工'].includes(item.nodeName)
}

function routeRuleExpression(rule) {
  const targetName = nodeName(rule.targetNodeCode)
  const condition = summarizeRouteConditions(rule.conditions)
  return `当「${rule.sourceNodeName}」状态 = ${outputResultLabel(nodeDetailForm.value, rule.sourceStatus)}${condition ? `，且 ${condition}` : ''}，进入「${targetName}」`
}

function entryRelationLabel(index) {
  if (index === 0) return '当'
  return nodeDetailForm.value.entryLogicMode === 'any' ? '或' : '且'
}

function entryRuleExpression(rule, targetNode) {
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === rule.sourceNodeCode)
  const sourceName = source?.nodeName || rule.sourceNodeName || nodeName(rule.sourceNodeCode)
  const targetName = targetNode?.nodeName || rule.targetNodeName || nodeName(rule.targetNodeCode)
  const condition = summarizeRouteConditions(rule.conditions)
  return `「${sourceName}」输出 = ${outputResultLabel(source, rule.sourceStatus)}${condition ? `，且 ${condition}` : ''}，进入「${targetName}」`
}

function routeRuleSentence(source, route, target) {
  const sourceName = source?.nodeName || nodeName(route.sourceNodeCode)
  const targetName = target?.nodeName || nodeName(route.targetNodeCode)
  const status = outputResultLabel(source, normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || [], source))
  const condition = routeConditionText(route)
  return `当「${sourceName}」状态 = ${status}${condition ? `，且 ${condition}` : ''}，进入「${targetName}」`
}

function routeNodeStatus(source, route) {
  return outputResultLabel(source, normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || [], source))
}

function routeOutputStatusOptionsByNode(nodeLike) {
  return normalizeStatusOutputOptionsForNode(nodeLike, nodeLike?.statusOutputOptions)
}

function outputStatusOptionsByNode(nodeLike) {
  return routeOutputStatusOptionsByNode(nodeLike)
}

function normalizeStatusOutputOptionsForNode(nodeLike, options = []) {
  if (nodeLike?.nodeType === 'systemTask') return defaultOutputStatusOptionsForNode(nodeLike)
  const defaultOptions = defaultOutputStatusOptionsForNode(nodeLike)
  const defaultValues = new Set(defaultOptions.map(item => item.value))
  const customOptions = cloneStatusOutputOptions(options)
    .filter(item => item.value !== 'workStarted')
    .filter(item => !defaultValues.has(item.value))
  return mergeOutputOptions(defaultOptions, customOptions)
}

function defaultOutputStatusOptionsForNode(nodeLike) {
  if (!nodeLike) return routeStatusOptions.filter(item => item.value === 'completed')
  if (nodeLike.nodeType === 'approvalFlow') return approvalExecutionResultOptions
  if (nodeLike.nodeType === 'systemTask') return systemExecutionResultOptionsForNode(nodeLike)
  if (nodeLike.nodeType === 'dispatchFlow') return workStageExecutionResultOptions
  if (nodeLike.nodeType === 'end') return routeStatusOptions.filter(item => ['completed', 'rejected'].includes(item.value))
  return workStageExecutionResultOptions
}

function systemExecutionResultOptionsForNode(nodeLike) {
  if (nodeLike?.systemActionTemplate === 'sapPaymentProcess' || nodeLike?.nodeCode === 'sapPaymentProcess') {
    return sapPaymentExecutionResultOptions
  }
  return defaultSystemExecutionResultOptions
}

function decorateStatusOutputOptions(options = []) {
  return cloneStatusOutputOptions(options).map(item => ({
    ...item,
    _preset: executionResultPresetValues.has(item.value),
    _previousValue: item.value
  }))
}

function mergeOutputOptions(primary = [], fallback = []) {
  const optionMap = new Map()
  ;[...primary, ...fallback].forEach(item => {
    if (!item?.value || optionMap.has(item.value)) return
    optionMap.set(item.value, {
      value: item.value,
      label: item.label || item.value
    })
  })
  return Array.from(optionMap.values())
}

function defaultRouteStatusForNode(nodeLike) {
  if (nodeLike?.nodeType === 'approvalFlow') return 'approved'
  return 'completed'
}

function normalizedRouteSourceStatus(route, nodes = [], sourceOverride = null) {
  if (route?.sourceStatus) return route.sourceStatus
  const source = sourceOverride || nodes.find(item => item.nodeCode === route?.sourceNodeCode)
  if (route?.routeType === 'reject') return 'rejected'
  if (route?.routeType === 'approve' || source?.nodeType === 'approvalFlow') return 'approved'
  if (route?.routeType === 'bypass') return defaultRouteStatusForNode(source)
  return defaultRouteStatusForNode(source)
}

function routeStatusLabel(value) {
  return routeStatusOptions.find(item => item.value === value)?.label || value || '完成'
}

function outputResultLabel(nodeLike, value) {
  return outputStatusOptionsByNode(nodeLike).find(item => item.value === value)?.label || routeStatusLabel(value)
}

function entryOutputStatusOptions(rule) {
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === rule?.sourceNodeCode)
  return outputStatusOptionsByNode(source)
}

function outputRouteImpactsForNode(nodeLike) {
  if (!nodeLike?.nodeCode) return []
  const nodes = selectedWorkflow.value.nodes || []
  const source = nodes.find(item => item.nodeCode === nodeLike.nodeCode) || nodeLike
  return normalizeRoutes(selectedWorkflow.value.routes || [], nodes)
    .filter(route => route.sourceNodeCode === nodeLike.nodeCode)
    .map((route, index) => ({
      id: `${route.sourceNodeCode}-${route.targetNodeCode}-${route.sourceStatus || 'completed'}-${index}`,
      statusLabel: outputResultLabel(source, route.sourceStatus || normalizedRouteSourceStatus(route, nodes, source)),
      targetName: nodeName(route.targetNodeCode),
      conditionText: routeConditionText(route)
    }))
}

function routeTypeForStatus(source, sourceStatus) {
  if (sourceStatus === 'rejected') return 'reject'
  if (source?.nodeType === 'approvalFlow' && sourceStatus === 'approved') return 'approve'
  return 'default'
}

function routeConditionText(route) {
  return summarizeRouteConditions(route.extraConditions || [])
}

function summarizeRouteConditions(conditions) {
  if (!Array.isArray(conditions) || conditions.length === 0) return ''
  const completeRules = conditions.filter(item => typeof item === 'string' || isConditionRuleComplete(item))
  if (completeRules.length === 0) return ''
  return completeRules.map((item, index) => {
    if (typeof item === 'string') return item
    const relation = index === 0 ? '' : `${relationLabel(item.relation)} `
    return `${relation}${conditionFieldLabel(item.field)} ${conditionOperatorLabel(item.operator)} ${conditionValueLabel(item.field, item.value)}`
  }).join(' ')
}

function cloneRouteConditionRules(conditions = []) {
  if (!Array.isArray(conditions)) return []
  return conditions.map(item => {
    if (typeof item === 'string') return item
    return conditionRule(item.field, item.operator, item.value, item.relation)
  })
}

function cloneEditableRouteConditions(conditions = []) {
  return cloneRouteConditionRules(conditions).filter(item => typeof item !== 'string')
}

function addRouteCondition(ruleIndex) {
  const routeRule = nodeDetailForm.value.routeRules[ruleIndex]
  if (!routeRule) return
  const field = defaultRouteConditionField(routeRule)
  routeRule.conditions.push(conditionRule(field, defaultRouteConditionOperator(field), emptyConditionValue(field, selectedWorkflow.value), 'AND'))
}

function removeRouteCondition(ruleIndex, conditionIndex) {
  const routeRule = nodeDetailForm.value.routeRules[ruleIndex]
  if (!routeRule) return
  routeRule.conditions.splice(conditionIndex, 1)
}

function addEntryCondition(ruleIndex) {
  const entryRule = nodeDetailForm.value.entryRules[ruleIndex]
  if (!entryRule) return
  const field = defaultRouteConditionField(entryRule)
  entryRule.conditions.push(conditionRule(field, defaultRouteConditionOperator(field), emptyConditionValue(field, selectedWorkflow.value), 'AND'))
}

function removeEntryCondition(ruleIndex, conditionIndex) {
  const entryRule = nodeDetailForm.value.entryRules[ruleIndex]
  if (!entryRule) return
  entryRule.conditions.splice(conditionIndex, 1)
}

function changeRouteConditionField(condition) {
  condition.operator = defaultRouteConditionOperator(condition.field)
  condition.value = emptyConditionValue(condition.field, selectedWorkflow.value)
}

function defaultRouteConditionField(routeRule = null) {
  if (routeRule?.sourceStatus === 'rejected') return 'rejectReason'
  return selectedWorkflow.value.workTypeCode === 'repair' ? 'estimatedRepairAmount' : 'riskLevel'
}

function defaultRouteConditionOperator(field) {
  return field === 'estimatedRepairAmount' ? 'gt' : 'eq'
}

function changeRouteRuleTarget(rule) {
  rule.targetNodeName = nodeName(rule.targetNodeCode)
}

function changeEntryRuleSource(rule) {
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === rule.sourceNodeCode)
  rule.sourceNodeName = source?.nodeName || nodeName(rule.sourceNodeCode)
  const options = entryOutputStatusOptions(rule)
  rule.sourceStatus = options.some(item => item.value === rule.sourceStatus) ? rule.sourceStatus : options[0]?.value || 'completed'
  rule.routeType = routeTypeForStatus(source, rule.sourceStatus)
}

function addEntryRule() {
  if (!selectedNode.value) return
  const targetNodeCode = selectedNode.value.nodeCode
  const sourceNodeCode = previousNodeCode(targetNodeCode) || entrySourceNodeOptions.value[0]?.value || ''
  const source = selectedWorkflow.value.nodes.find(item => item.nodeCode === sourceNodeCode)
  const defaultStatus = defaultRouteStatusForNode(source)
  nodeDetailForm.value.entryRules.push({
    id: `entry-${Date.now()}-${nodeDetailForm.value.entryRules.length}`,
    originalRouteKey: '',
    routeType: routeTypeForStatus(source, defaultStatus),
    sourceNodeCode,
    targetNodeCode,
    sourceStatus: defaultStatus,
    sourceNodeName: source?.nodeName || nodeName(sourceNodeCode),
    targetNodeName: nodeDetailForm.value.nodeName,
    editable: true,
    generatedHint: '',
    conditions: []
  })
}

function removeEntryRule(ruleIndex) {
  nodeDetailForm.value.entryRules.splice(ruleIndex, 1)
}

function addRouteRule() {
  if (!selectedNode.value || nodeDetailForm.value.nodeType === 'end') return
  const source = selectedNode.value
  const defaultStatus = defaultRouteStatusForNode(nodeDetailForm.value)
  const targetNodeCode = nextNodeCode(source.nodeCode) || routeTargetOptions.value[0]?.value || ''
  nodeDetailForm.value.routeRules.push({
    id: `route-${Date.now()}-${nodeDetailForm.value.routeRules.length}`,
    originalRouteKey: '',
    routeType: routeTypeForStatus(source, defaultStatus),
    sourceNodeCode: source.nodeCode,
    targetNodeCode,
    sourceStatus: defaultStatus,
    sourceNodeName: nodeDetailForm.value.nodeName,
    targetNodeName: nodeName(targetNodeCode),
    editable: true,
    generatedHint: '',
    conditions: []
  })
}

function removeRouteRule(ruleIndex) {
  nodeDetailForm.value.routeRules.splice(ruleIndex, 1)
}

function changeWorkStageRejectSwitch() {
  if (nodeDetailForm.value.allowRejectSwitch === 'checked') {
    nodeDetailForm.value.rejectTargetNodeCode = nodeDetailForm.value.rejectTargetNodeCode || defaultRejectTargetNodeCode(nodeDetailForm.value)
    ensureWorkStageRejectRoute()
  } else {
    nodeDetailForm.value.routeRules = nodeDetailForm.value.routeRules.filter(rule => rule.sourceStatus !== 'rejected')
    nodeDetailForm.value.rejectTargetNodeCode = ''
  }
}

function ensureWorkStageRejectRoute() {
  if (nodeDetailForm.value.nodeType !== 'workStage' || nodeDetailForm.value.allowRejectSwitch !== 'checked') return
  const targetNodeCode = nodeDetailForm.value.rejectTargetNodeCode || defaultRejectTargetNodeCode(nodeDetailForm.value)
  if (!targetNodeCode) return
  nodeDetailForm.value.rejectTargetNodeCode = targetNodeCode
  const rejectRule = nodeDetailForm.value.routeRules.find(rule => rule.sourceStatus === 'rejected')
  if (rejectRule) {
    rejectRule.targetNodeCode = targetNodeCode
    rejectRule.targetNodeName = nodeName(targetNodeCode)
    return
  }
  nodeDetailForm.value.routeRules.push({
    id: `reject-route-${Date.now()}`,
    originalRouteKey: '',
    routeType: 'reject',
    sourceNodeCode: nodeDetailForm.value.nodeCode,
    targetNodeCode,
    sourceStatus: 'rejected',
    sourceNodeName: nodeDetailForm.value.nodeName,
    targetNodeName: nodeName(targetNodeCode),
    editable: true,
    generatedHint: '',
    conditions: []
  })
}

function currentRejectTargetNodeCode() {
  const rejectRule = nodeDetailForm.value.routeRules.find(rule => rule.sourceStatus === 'rejected')
  return rejectRule?.targetNodeCode || nodeDetailForm.value.rejectTargetNodeCode || ''
}

function defaultRejectTargetNodeCode(nodeLike) {
  const nodes = selectedWorkflow.value.nodes || []
  const currentIndex = nodes.findIndex(item => item.nodeCode === nodeLike?.nodeCode)
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = nodes[index]
    if (candidate?.nodeType !== 'start' && candidate?.nodeType !== 'approvalFlow' && candidate?.nodeType !== 'systemTask') {
      return candidate.nodeCode
    }
  }
  return nodes.find(item => item.nodeType === 'start')?.nodeCode || ''
}

function nextNodeCode(sourceNodeCode) {
  const nodes = selectedWorkflow.value.nodes || []
  const currentIndex = nodes.findIndex(item => item.nodeCode === sourceNodeCode)
  return currentIndex >= 0 ? nodes[currentIndex + 1]?.nodeCode || '' : ''
}

function previousNodeCode(targetNodeCode) {
  const nodes = selectedWorkflow.value.nodes || []
  const currentIndex = nodes.findIndex(item => item.nodeCode === targetNodeCode)
  if (currentIndex <= 0) return ''
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = nodes[index]
    if (candidate?.nodeType !== 'end') return candidate.nodeCode
  }
  return ''
}

function applyNodeRouteRules(routeRules) {
  if (!selectedNode.value?.nodeCode) return
  const sourceNode = selectedNode.value
  const sourceNodeCode = sourceNode.nodeCode
  const nodes = selectedWorkflow.value.nodes || []
  const baselineRoutes = normalizeRoutes(buildGeneratedRoutes(nodes), nodes).filter(route => route.sourceNodeCode === sourceNodeCode)
  const editedRoutes = routeRules
    .filter(rule => rule.editable && rule.targetNodeCode && rule.sourceStatus)
    .map((rule, index) => normalizeRoute({
      sourceNodeCode,
      targetNodeCode: rule.targetNodeCode,
      sourceStatus: rule.sourceStatus,
      conditionSummary: outputResultLabel(sourceNode, rule.sourceStatus),
      routeType: routeTypeForStatus(sourceNode, rule.sourceStatus),
      priority: String((index + 1) * 10),
      extraConditions: cloneRouteConditionRules(rule.conditions).filter(isConditionRuleComplete)
    }, nodes))
  const editedRouteKeys = new Set(editedRoutes.map(routeConditionRuleKey))
  const disabledForOtherSources = (selectedWorkflow.value.disabledRouteRules || []).filter(rule => rule.sourceNodeCode !== sourceNodeCode)
  const removedGeneratedRoutes = baselineRoutes.filter(route => !editedRouteKeys.has(routeConditionRuleKey(route)))
  selectedWorkflow.value.disabledRouteRules = dedupeRouteConditionRules([
    ...disabledForOtherSources,
    ...removedGeneratedRoutes.map(routeToStoredRouteRule)
  ])

  const customRoutesForOtherSources = (selectedWorkflow.value.routeConditionRules || []).filter(rule => rule.sourceNodeCode !== sourceNodeCode)
  const customEditedRoutes = editedRoutes.filter(route => !isGeneratedRouteEquivalent(route, baselineRoutes))
  selectedWorkflow.value.routeConditionRules = dedupeRouteConditionRules([
    ...customRoutesForOtherSources,
    ...customEditedRoutes.map(routeToStoredRouteRule)
  ])
  selectedWorkflow.value.routes = applyStoredRouteRules(buildGeneratedRoutes(nodes), [], nodes, selectedWorkflow.value)
}

function applyNodeEntryRules(entryRules) {
  if (!selectedNode.value?.nodeCode) return
  const targetNode = selectedNode.value
  const targetNodeCode = targetNode.nodeCode
  const nodes = selectedWorkflow.value.nodes || []
  const nodeMap = new Map(nodes.map(item => [item.nodeCode, item]))
  const entryLogicMode = ['all', 'any'].includes(nodeDetailForm.value.entryLogicMode) ? nodeDetailForm.value.entryLogicMode : 'all'
  const baselineRoutes = normalizeRoutes(buildGeneratedRoutes(nodes), nodes).filter(route => route.targetNodeCode === targetNodeCode)
  const editedRoutes = (entryRules || [])
    .filter(rule => rule.editable && rule.sourceNodeCode && rule.sourceStatus && nodeMap.has(rule.sourceNodeCode))
    .filter(rule => rule.sourceNodeCode !== targetNodeCode)
    .map((rule, index) => {
      const source = nodeMap.get(rule.sourceNodeCode)
      return normalizeRoute({
        sourceNodeCode: rule.sourceNodeCode,
        targetNodeCode,
        sourceStatus: rule.sourceStatus,
        conditionSummary: outputResultLabel(source, rule.sourceStatus),
        routeType: routeTypeForStatus(source, rule.sourceStatus),
        priority: String((index + 1) * 10),
        extraConditions: cloneRouteConditionRules(rule.conditions).filter(isConditionRuleComplete),
        entryConfigured: true,
        entryLogicMode
      }, nodes)
    })
  const editedRouteKeys = new Set(editedRoutes.map(routeConditionRuleKey))
  const disabledForOtherTargets = (selectedWorkflow.value.disabledRouteRules || []).filter(rule => rule.targetNodeCode !== targetNodeCode)
  const removedGeneratedRoutes = baselineRoutes.filter(route => !editedRouteKeys.has(routeConditionRuleKey(route)))
  selectedWorkflow.value.disabledRouteRules = dedupeRouteConditionRules([
    ...disabledForOtherTargets,
    ...removedGeneratedRoutes.map(route => routeToStoredRouteRule({ ...route, entryConfigured: true, entryLogicMode }, nodes))
  ])

  const storedRoutesForOtherTargets = (selectedWorkflow.value.routeConditionRules || []).filter(rule => rule.targetNodeCode !== targetNodeCode)
  selectedWorkflow.value.routeConditionRules = dedupeRouteConditionRules([
    ...storedRoutesForOtherTargets,
    ...editedRoutes.map(route => routeToStoredRouteRule(route, nodes))
  ])
  selectedWorkflow.value.routes = applyStoredRouteRules(buildGeneratedRoutes(nodes), [], nodes, selectedWorkflow.value)
}

function isSameRoute(left, right) {
  return left.sourceNodeCode === right.sourceNodeCode
    && left.targetNodeCode === right.targetNodeCode
    && normalizedRouteSourceStatus(left, selectedWorkflow.value.nodes || []) === (right.sourceStatus || normalizedRouteSourceStatus(right, selectedWorkflow.value.nodes || []))
    && (left.routeType || 'default') === (right.routeType || 'default')
}

function isSameRouteForNodes(left, right, nodes = []) {
  return left.sourceNodeCode === right.sourceNodeCode
    && left.targetNodeCode === right.targetNodeCode
    && normalizedRouteSourceStatus(left, nodes) === (right.sourceStatus || normalizedRouteSourceStatus(right, nodes))
    && (left.routeType || 'default') === (right.routeType || 'default')
}

function collectStoredRouteConditions(workflow, previousRoutes = [], nodes = []) {
  return dedupeRouteConditionRules(Array.isArray(workflow?.routeConditionRules) ? workflow.routeConditionRules : [])
}

function routeConditionRulesFromRoutes(routes = [], nodes = []) {
  return routes
    .filter(route => route?.sourceNodeCode && route?.targetNodeCode && !isLegacyAutoBypassRoute(route))
    .map(route => routeToStoredRouteRule(route, nodes))
}

function routeToStoredRouteRule(route, nodes = selectedWorkflow.value?.nodes || []) {
  const sourceStatus = route.sourceStatus || normalizedRouteSourceStatus(route, nodes)
  return {
    sourceNodeCode: route.sourceNodeCode,
    targetNodeCode: route.targetNodeCode,
    sourceStatus,
    routeType: route.routeType || 'default',
    conditionSummary: route.conditionSummary || outputResultLabel(nodes.find(item => item.nodeCode === route.sourceNodeCode), sourceStatus),
    priority: route.priority || '',
    extraConditions: cloneRouteConditionRules(route.extraConditions).filter(isConditionRuleComplete),
    entryConfigured: route.entryConfigured === true,
    entryLogicMode: route.entryLogicMode || ''
  }
}

function isGeneratedRouteEquivalent(route, baselineRoutes = []) {
  return baselineRoutes.some(item =>
    routeConditionRuleKey(item) === routeConditionRuleKey(route)
    && summarizeRouteConditions(item.extraConditions) === summarizeRouteConditions(route.extraConditions)
  )
}

function dedupeRouteConditionRules(rules) {
  const ruleMap = new Map()
  rules.forEach(rule => {
    if (!rule?.sourceNodeCode || !rule?.targetNodeCode) return
    const sourceStatus = rule.sourceStatus || 'completed'
    ruleMap.set(routeConditionRuleKey(rule), {
      ...rule,
      sourceStatus,
      routeType: rule.routeType || 'default',
      extraConditions: cloneRouteConditionRules(rule.extraConditions).filter(isConditionRuleComplete)
    })
  })
  return Array.from(ruleMap.values())
}

function routeConditionRuleKey(rule) {
  const sourceStatus = rule.sourceStatus || 'completed'
  return `${rule.sourceNodeCode}->${rule.targetNodeCode}:${sourceStatus}:${rule.routeType || 'default'}`
}

function findStoredRouteCondition(storedConditions, route, nodes) {
  return [...storedConditions].reverse().find(rule => isSameRouteForNodes(rule, route, nodes) || isEquivalentScheduledRoute(rule, route, nodes))
}

function isEquivalentScheduledRoute(rule, route, nodes) {
  if (rule.sourceNodeCode !== route.sourceNodeCode || (rule.routeType || 'default') !== (route.routeType || 'default')) return false
  if (normalizedRouteSourceStatus(rule, nodes) !== normalizedRouteSourceStatus(route, nodes)) return false
  return scheduledRouteBusinessTarget(route.targetNodeCode, nodes) === rule.targetNodeCode
    || scheduledRouteBusinessTarget(rule.targetNodeCode, nodes) === route.targetNodeCode
}

function scheduledRouteBusinessTarget(nodeCode, nodes) {
  const nodeIndex = nodes.findIndex(item => item.nodeCode === nodeCode)
  const currentNode = nodes[nodeIndex]
  const nextNode = nodes[nodeIndex + 1]
  if (nodeIndex === -1) return scheduleOwnerStageCode(nodeCode) || nodeCode
  return isGeneratedScheduleNode(currentNode) && nextNode ? nextNode.nodeCode : nodeCode
}

function scheduleOwnerStageCode(nodeCode) {
  if (typeof nodeCode !== 'string') return ''
  return nodeCode
    .replace(/-ai-schedule$/, '')
    .replace(/-schedule-dispatch$/, '')
}

function syncWorkflowRouteConditions(workflow, routes = workflow?.routes || []) {
  if (!workflow) return
  workflow.routeConditionRules = routeConditionRulesFromRoutes(routes, workflow.nodes || [])
}

function normalizeRoutes(routes = [], nodes = []) {
  return dedupeRoutes(routes.filter(route => !isLegacyAutoBypassRoute(route)).map(route => normalizeRoute(route, nodes)))
}

function normalizeRoute(route, nodes = []) {
  const source = nodes.find(item => item.nodeCode === route?.sourceNodeCode)
  const sourceStatus = normalizedRouteSourceStatus(route, nodes, source)
  return {
    ...route,
    sourceStatus,
    routeType: route?.routeType || routeTypeForStatus(source, sourceStatus),
    conditionSummary: route?.conditionSummary || outputResultLabel(source, sourceStatus),
    extraConditions: cloneRouteConditionRules(route?.extraConditions).filter(isConditionRuleComplete)
  }
}

function dedupeRoutes(routes = []) {
  const routeMap = new Map()
  routes.forEach(route => {
    if (!route?.sourceNodeCode || !route?.targetNodeCode) return
    routeMap.set(routeConditionRuleKey(route), route)
  })
  return Array.from(routeMap.values())
}

function isLegacyAutoBypassRoute(route) {
  return route?.routeType === 'bypass' && !!route.bypassNodeCode
}

function ensureConditionalBypassRoutes(routes, nodes) {
  const nextRoutes = [...routes]
  routes.forEach(route => {
    if (!conditionalRouteCanBypass(route)) return
    const targetIndex = nodes.findIndex(item => item.nodeCode === route.targetNodeCode)
    const conditionalNode = nodes[targetIndex]
    const bypassTargetIndex = conditionalBypassTargetIndex(route, nodes)
    const afterConditionalNode = nodes[bypassTargetIndex]
    const sourceNode = nodes.find(item => item.nodeCode === route.sourceNodeCode)
    if (!sourceNode || !conditionalNode || !afterConditionalNode || !routeConditionText(route)) return
    const bypassRoute = {
      sourceNodeCode: route.sourceNodeCode,
      targetNodeCode: afterConditionalNode.nodeCode,
      bypassNodeCode: conditionalNode.nodeCode,
      conditionSummary: '条件不满足',
      routeType: 'bypass',
      priority: String((nextRoutes.length + 1) * 10),
      extraConditions: buildBypassConditions(route.extraConditions)
    }
    const existingIndex = nextRoutes.findIndex(item => isSameRoute(item, bypassRoute))
    if (existingIndex >= 0) nextRoutes.splice(existingIndex, 1, bypassRoute)
    else nextRoutes.push(bypassRoute)
  })
  return nextRoutes
}

function conditionalRouteCanBypass(route) {
  return ['default', 'approve'].includes(route.routeType || 'default')
}

function conditionalBypassTargetIndex(route, nodes) {
  const targetIndex = nodes.findIndex(item => item.nodeCode === route.targetNodeCode)
  if (targetIndex === -1) return -1
  const conditionalNode = nodes[targetIndex]
  if (isGeneratedScheduleNode(conditionalNode) && isStageNode(nodes[targetIndex + 1])) {
    return targetIndex + 2
  }
  return targetIndex + 1
}

function buildBypassConditions(conditions = []) {
  const complete = cloneRouteConditionRules(conditions).filter(isConditionRuleComplete)
  if (complete.length === 1 && typeof complete[0] !== 'string') {
    const rule = complete[0]
    return [conditionRule(rule.field, negatedOperator(rule.operator), rule.value, 'AND')]
  }
  const text = summarizeRouteConditions(complete)
  return text ? [`不满足（${text}）`] : []
}

function negatedOperator(operator) {
  const map = {
    eq: 'neq',
    neq: 'eq',
    gt: 'lte',
    gte: 'lt',
    lt: 'gte',
    lte: 'gt'
  }
  return map[operator] || 'neq'
}

function businessObjectTypeByWorkType(value) {
  const map = {
    serviceRequest: 'requirementOrder',
    assetManagement: 'assetChangeOrder'
  }
  return map[value] || 'workOrder'
}

function startNodeNameByWorkType(value) {
  if (value === 'serviceRequest') return '用户提交'
  if (value === 'assetManagement') return '状态变更申请'
  if (value === 'inspection' || value === 'maintenance') return '计划生成'
  return '工单生成'
}

function endNodeNameByWorkType(value) {
  if (value === 'serviceRequest') return '关闭'
  return '归档关闭'
}

function dispatchMethodByNode(item) {
  if (item.executionMode === 'candidateAnyOne') return 'teamCandidate'
  if (item.executionMode === 'multiExecutorAll') return 'fixedRole'
  if (item.nodeName.includes('专业')) return 'fixedRole'
  return 'manualDispatch'
}

function executionModeByDispatch(value) {
  const map = {
    teamCandidate: 'candidateAnyOne',
    fixedRole: 'multiExecutorAll',
    objectOwner: 'singleExecutor',
    upstreamResult: 'singleExecutor',
    manualDispatch: 'singleExecutor'
  }
  return map[value] || 'singleExecutor'
}

function pagePolicyByStage(stageTemplate, workTypeCode) {
  const map = {
    accept: 'acceptPage',
    dispatch: 'dispatchPage',
    diagnosis: 'repairDiagnosisPage',
    plan: 'planPage',
    resource: 'materialPage',
    externalCollaboration: 'externalPage',
    acceptance: 'acceptancePage',
    userConfirm: 'callbackPage',
    archive: 'archivePage',
    inspectionExecution: 'inspectionExecutionPage',
    maintenanceExecution: 'maintenanceExecutionPage',
    repairExecution: 'repairExecutionPage'
  }
  if (map[stageTemplate]) return map[stageTemplate]
  if (workTypeCode === 'inspection') return 'inspectionExecutionPage'
  if (workTypeCode === 'maintenance') return 'maintenanceExecutionPage'
  if (workTypeCode === 'repair') return 'repairExecutionPage'
  return 'dispatchPage'
}

function slaByWorkType(value) {
  const map = {
    repair: 'sla-emergency-2h',
    serviceRequest: 'sla-service-callback',
    maintenance: 'sla-maintenance-plan'
  }
  return map[value] || 'sla-normal-24h'
}

function approvalFlowByWorkType(value) {
  const map = {
    inspection: 'approval-inspection-review',
    maintenance: 'approval-maintenance-cost',
    repair: 'approval-repair-risk',
    engineeringChange: 'approval-engineering-budget',
    serviceRequest: 'approval-service-upgrade'
  }
  return map[value] || 'approval-repair-risk'
}

function systemActionByWorkType(value) {
  const map = {
    maintenance: 'erpMaterialCheck',
    repair: 'erpMaterialCheck',
    engineeringChange: 'sapBudgetCheck',
    assetManagement: 'assetStatusSync',
    serviceRequest: 'serviceOrderDerive'
  }
  return map[value] || 'erpMaterialCheck'
}

function dispatchMethodLabel(value) {
  return dispatchMethodOptions.find(item => item.value === value)?.label || value
}

function approvalFlowLabel(value) {
  return approvalFlowOptions.find(item => item.value === value)?.label || value
}

function rejectPolicyLabel(value) {
  return rejectPolicyOptions.find(item => item.value === value)?.label || value
}

function systemActionLabel(value) {
  return systemActionOptions.find(item => item.value === value)?.label || value
}

function assignmentTargetLabel(stage) {
  const source = stage.assignmentTargetType === 'person' ? assignmentPersonOptions : assignmentRoleOptions
  return source.find(item => item.value === stage.assignmentTarget)?.label || '未指定分配人'
}

function executorSourceSummary(source, roleValue, personValue) {
  if (source === 'manualSelect') {
    return assignmentPersonOptions.find(item => item.value === personValue)?.label || '指定人员'
  }
  if (source === 'fixedRole') {
    return assignmentRoleOptions.find(item => item.value === roleValue)?.label || '指定岗位'
  }
  if (source === 'creator') return '创建人'
  if (source === 'specifiedNodeExecutor') return '指定节点执行人'
  return '排程结果'
}

function flowNodeExecutorText(nodeLike) {
  if (!['workStage', 'dispatchFlow'].includes(nodeLike?.nodeType)) return ''
  if (nodeLike.assignmentEnabledSwitch === 'checked' && nodeLike.nodeType !== 'dispatchFlow') return '继承排程结果'

  const source = normalizeExecutorSourceForNode(nodeLike)
  if (source === 'creator') return '创建人'
  if (source === 'inheritDispatch') return '继承排程结果'
  if (source === 'specifiedNodeExecutor') {
    return nodeLike.executorSourceNodeCode ? `${nodeName(nodeLike.executorSourceNodeCode)}执行人` : '指定节点执行人'
  }
  if (source === 'fixedRole') {
    return assignmentRoleOptions.find(item => item.value === nodeLike.fallbackExecutor)?.label || '指定岗位'
  }
  if (source === 'manualSelect') {
    return assignmentPersonOptions.find(item => item.value === nodeLike.executorPerson)?.label || '指定人员'
  }
  return executorSourceSummary(source, nodeLike.fallbackExecutor, nodeLike.executorPerson)
}

function systemNodePositionText(config) {
  const targetName = stageTargetOptions.value.find(item => item.value === config.targetStageCode)?.label || nodeName(config.targetStageCode)
  return `${targetName}${config.position === 'before' ? '前' : '后'}`
}

function actionTimingLabel(value) {
  return actionTimingOptions.find(item => item.value === value)?.label || value
}

function actionFailureLabel(value) {
  return actionFailureOptions.find(item => item.value === value)?.label || value
}

function toSelectOptions(options) {
  return options.map(item => ({
    id: item.value,
    name: item.label,
    disabled: item.disabled
  }))
}

function routeId(source, target) {
  return `${source}-${target}`
}

function buildFlowLayout(nodes = []) {
  const nodeLayouts = []
  let y = FLOW_CANVAS_PADDING_Y
  nodes.forEach((item, index) => {
    const x = FLOW_NODE_CENTER_X - FLOW_NODE_WIDTH / 2
    nodeLayouts.push({
      node: item,
      index,
      x,
      y,
      width: FLOW_NODE_WIDTH,
      height: FLOW_NODE_HEIGHT,
      anchors: {
        top: { x: FLOW_NODE_CENTER_X, y },
        bottom: { x: FLOW_NODE_CENTER_X, y: y + FLOW_NODE_HEIGHT },
        left: { x, y: y + FLOW_NODE_HEIGHT / 2 },
        right: { x: x + FLOW_NODE_WIDTH, y: y + FLOW_NODE_HEIGHT / 2 }
      }
    })
    if (index < nodes.length - 1) {
      y += FLOW_NODE_HEIGHT + flowRouteHeight(item)
    }
  })
  return {
    width: FLOW_CANVAS_WIDTH,
    height: Math.max(y + FLOW_NODE_HEIGHT + FLOW_CANVAS_PADDING_Y, 520),
    nodes: nodeLayouts,
    nodeMap: Object.fromEntries(nodeLayouts.map(item => [item.node.nodeCode, item]))
  }
}

function buildFlowRouteArtifacts(workflow, layout) {
  const lines = []
  const labels = []
  const routes = normalizeRoutes(workflow?.routes || [], workflow?.nodes || [])
  routes.forEach((route, index) => {
    const source = layout.nodeMap[route.sourceNodeCode]
    const target = layout.nodeMap[route.targetNodeCode]
    if (!source || !target) return
    const id = `${route.sourceNodeCode}-${route.targetNodeCode}-${route.routeType || 'default'}-${index}`
    const targetIsPrevious = target.index < source.index
    const targetIsAdjacentNext = target.index === source.index + 1
    if (targetIsPrevious) {
      const path = rejectRoutePathFromAnchors(source.anchors.left, target.anchors.left)
      lines.push({ id, kind: 'reject', path })
      labels.push({
        id: `${id}-label`,
        kind: 'reject',
        text: routeDisplaySummary(route),
        ...rejectRouteLabelPosition(source.anchors.left, target.anchors.left)
      })
      return
    }
    if (!targetIsAdjacentNext) {
      const path = bypassRoutePathFromAnchors(source.anchors.right, target.anchors.right)
      lines.push({ id, kind: 'bypass', path })
      labels.push({
        id: `${id}-label`,
        kind: 'bypass',
        text: routeDisplaySummary(route),
        ...bypassRouteLabelPosition(source.anchors.right, target.anchors.right)
      })
      return
    }
    lines.push({
      id,
      kind: 'forward',
      path: forwardRoutePathFromAnchors(source.anchors.bottom, target.anchors.top)
    })
    labels.push({
      id: `${id}-label`,
      kind: 'pass',
      text: routeDisplaySummary(route),
      ...forwardRouteLabelPosition(source.anchors.bottom, target.anchors.top)
    })
  })
  return { lines, labels }
}

function forwardRoutePathFromAnchors(start, end) {
  return `M${start.x} ${start.y} V${end.y}`
}

function rejectRoutePathFromAnchors(start, end) {
  const sideX = Math.min(start.x, end.x) - ROUTE_SIDE_OFFSET
  const upperY = Math.min(start.y, end.y)
  const lowerY = Math.max(start.y, end.y)
  const radius = Math.min(ROUTE_CORNER_RADIUS, Math.max(8, (lowerY - upperY) / 4))
  if (start.y > end.y) {
    return `M${start.x} ${start.y} H${sideX + radius} Q${sideX} ${start.y} ${sideX} ${start.y - radius} V${end.y + radius} Q${sideX} ${end.y} ${sideX + radius} ${end.y} H${end.x}`
  }
  return `M${start.x} ${start.y} H${sideX + radius} Q${sideX} ${start.y} ${sideX} ${start.y + radius} V${end.y - radius} Q${sideX} ${end.y} ${sideX + radius} ${end.y} H${end.x}`
}

function bypassRoutePathFromAnchors(start, end) {
  const sideX = Math.max(start.x, end.x) + ROUTE_SIDE_OFFSET
  const upperY = Math.min(start.y, end.y)
  const lowerY = Math.max(start.y, end.y)
  const radius = Math.min(ROUTE_CORNER_RADIUS, Math.max(8, (lowerY - upperY) / 4))
  if (start.y < end.y) {
    return `M${start.x} ${start.y} H${sideX - radius} Q${sideX} ${start.y} ${sideX} ${start.y + radius} V${end.y - radius} Q${sideX} ${end.y} ${sideX - radius} ${end.y} H${end.x}`
  }
  return `M${start.x} ${start.y} H${sideX - radius} Q${sideX} ${start.y} ${sideX} ${start.y - radius} V${end.y + radius} Q${sideX} ${end.y} ${sideX - radius} ${end.y} H${end.x}`
}

function forwardRouteLabelPosition(start, end) {
  return {
    x: start.x - ROUTE_LABEL_WIDTH / 2,
    y: start.y + (end.y - start.y) / 2 - ROUTE_LABEL_HEIGHT / 2
  }
}

function rejectRouteLabelPosition(start, end) {
  return {
    x: Math.min(start.x, end.x) - ROUTE_SIDE_OFFSET - ROUTE_REJECT_LABEL_WIDTH / 2,
    y: (start.y + end.y) / 2 - ROUTE_LABEL_HEIGHT / 2
  }
}

function bypassRouteLabelPosition(start, end) {
  return {
    x: Math.max(start.x, end.x) + ROUTE_SIDE_OFFSET - ROUTE_BYPASS_LABEL_WIDTH / 2,
    y: (start.y + end.y) / 2 - ROUTE_LABEL_HEIGHT / 2
  }
}

function routeLabel(source, target) {
  const route = selectedWorkflow.value.routes.find(item => item.sourceNodeCode === source.nodeCode && item.targetNodeCode === target.nodeCode && item.routeType !== 'reject')
  return route ? routeDisplaySummary(route) : '默认'
}

function rejectRouteLabel(source, target) {
  const route = selectedWorkflow.value.routes.find(item => item.sourceNodeCode === source.nodeCode && item.targetNodeCode === target.nodeCode && item.routeType === 'reject')
  return route ? routeDisplaySummary(route) : normalizeRouteLabel('审批驳回')
}

function conditionalBypassRouteAt(index) {
  const source = selectedWorkflow.value.nodes[index]
  const conditionalNode = selectedWorkflow.value.nodes[index + 1]
  if (!source || !conditionalNode) return null
  return selectedWorkflow.value.routes.find(item =>
    item.sourceNodeCode === source.nodeCode
    && item.bypassNodeCode === conditionalNode.nodeCode
    && item.routeType === 'bypass'
  )
}

function routeBypassLabelAt(index) {
  const route = conditionalBypassRouteAt(index)
  return route ? routeDisplaySummary(route) : ''
}

function bypassRouteViewBox(index) {
  return `0 0 340 ${bypassRouteHeight(index)}`
}

function bypassRoutePath(index) {
  const y = bypassRouteEndY(index)
  return `M98 4 H248 Q268 4 268 24 V${Math.max(24, y - 20)} Q268 ${y} 248 ${y} H98`
}

function bypassRouteHeight(index) {
  return bypassRouteEndY(index) + 16
}

function bypassRouteLabelTop(index) {
  return Math.max(34, Math.round(bypassRouteEndY(index) / 2) - 12)
}

function bypassRouteEndY(index) {
  const route = conditionalBypassRouteAt(index)
  const targetIndex = selectedWorkflow.value.nodes.findIndex(item => item.nodeCode === route?.targetNodeCode)
  if (!route || targetIndex <= index + 1) return 244
  let distance = flowRouteHeight(selectedWorkflow.value.nodes[index])
  for (let nodeIndex = index + 1; nodeIndex < targetIndex; nodeIndex += 1) {
    distance += flowNodeHeight(selectedWorkflow.value.nodes[nodeIndex])
    distance += flowRouteHeight(selectedWorkflow.value.nodes[nodeIndex])
  }
  return distance
}

function flowNodeHeight() {
  return 108
}

function flowRouteHeight(nodeLike) {
  return nodeLike?.nodeType === 'approvalFlow' ? 126 : 68
}

function routeDisplaySummary(route) {
  const condition = routeConditionText(route)
  const source = (selectedWorkflow.value.nodes || []).find(item => item.nodeCode === route.sourceNodeCode)
  const status = outputResultLabel(source, route.sourceStatus || normalizedRouteSourceStatus(route, selectedWorkflow.value.nodes || [], source))
  return normalizeRouteLabel(condition ? `${status} 且 ${condition}` : status)
}

function normalizeRouteLabel(label) {
  const text = String(label || '默认').trim()
  if (text === '进入审批') return '需审批'
  return text
    .replace(/^审批/, '')
    .replace(/：进入.+$/, '')
    .replace(/：返回.+$/, '')
}

function nodeName(code) {
  return selectedWorkflow.value.nodes.find(item => item.nodeCode === code)?.nodeName || '未找到节点'
}

function nodeTypeLabel(value) {
  return nodeTypeOptions.find(item => item.value === value)?.label || value
}

function workTypeLabel(value) {
  return workTypeOptions.find(item => item.value === value)?.label || value
}

function classificationLabel(value) {
  return classificationOptions.find(item => item.value === normalizeClassificationCode(value))?.label || '未选择分类'
}

function defaultClassificationForWorkType(workTypeCode) {
  return classificationOptions.find(item => item.workTypeCode === workTypeCode)?.value || 'INS-DAY'
}

function classificationWorkType(value) {
  return classificationOptions.find(item => item.value === normalizeClassificationCode(value))?.workTypeCode || ''
}

function normalizeClassificationCode(value) {
  return legacyEngineeringClassificationMap[value] || value
}

function normalizeClassificationConditionRule(rule) {
  if (rule?.field !== 'classificationCode') return rule
  return {
    ...rule,
    value: normalizeClassificationConditionValue(rule.value)
  }
}

function normalizeClassificationConditionValue(value) {
  if (Array.isArray(value)) return value.map(normalizeClassificationCode)
  return normalizeClassificationCode(value)
}

</script>

<style scoped>
.workflow-page {
  height: calc(100vh - 48px);
  overflow: hidden;
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
}

.workflow-toast {
  position: fixed;
  top: 72px;
  left: 50%;
  z-index: 60;
  transform: translateX(-50%);
  min-width: 260px;
  max-width: min(520px, calc(100vw - 48px));
  border: 1px solid #b9e8c8;
  border-radius: var(--big-radius);
  background: #e9f8ef;
  color: var(--success-color);
  box-shadow: var(--shadow-2);
  padding: 10px 16px;
  text-align: center;
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: var(--font-weight-medium);
}

.workflow-toast-fade-enter-active,
.workflow-toast-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.workflow-toast-fade-enter-from,
.workflow-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.workflow-shell {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(620px, 1fr) minmax(430px, 460px);
  position: relative;
}

.workflow-left-panel,
.workflow-canvas-panel,
.workflow-right-panel {
  min-height: 0;
  overflow: hidden;
}

.workflow-left-panel,
.workflow-canvas-panel {
  background: var(--gray-0);
}

.workflow-left-panel {
  border-right: 1px solid var(--divider-bg-color);
  padding: var(--padding-4);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
  box-sizing: border-box;
}

.workflow-left-panel > * {
  width: 100%;
  box-sizing: border-box;
}

.workflow-canvas-panel {
  padding: var(--padding-4);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.workflow-right-panel {
  border-left: 1px solid var(--divider-bg-color);
  background: var(--gray-100);
  padding: var(--padding-4);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.panel-header,
.list-actions,
.tree-group-head,
.tree-flow-title,
.canvas-header,
.canvas-actions,
.validation-item {
  display: flex;
  align-items: center;
}

.panel-header,
.tree-group-head,
.canvas-header {
  justify-content: space-between;
  gap: var(--padding-3);
}

.panel-header--right {
  align-items: flex-start;
}

.panel-kicker {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.panel-header h2,
.canvas-title h2 {
  margin: var(--padding-1) 0 0;
  color: var(--title-color);
  font-size: var(--font-xl);
  line-height: var(--line-xl);
  font-weight: 600;
}

.workflow-left-panel .panel-header h2 {
  margin-top: 0;
}

.workflow-list-tools {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.workflow-config-tabs {
  flex: 0 0 auto;
}

.node-detail-tabs {
  flex: 0 0 auto;
  min-width: 0;
  margin-bottom: var(--padding-3);
}

.node-detail-tabs :deep(.m-tabs__nav),
.node-detail-tabs :deep(.m-tabs-list) {
  min-width: 0;
}

.node-detail-tabs :deep(.m-tabs__item),
.node-detail-tabs :deep(.m-tabs-item) {
  min-width: 0;
  padding-left: var(--padding-2);
  padding-right: var(--padding-2);
  font-size: var(--font-sm);
}

.workflow-tree,
.property-scroll {
  min-height: 0;
  overflow-y: auto;
}

.workflow-tree {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
  padding-right: var(--padding-1);
}

.tree-group {
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
}

.tree-group-head {
  min-height: 32px;
  padding: 0 var(--padding-1) var(--padding-2);
}

.tree-group-head strong {
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.tree-group-head span {
  margin-left: var(--padding-2);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.tree-flow {
  border-radius: var(--big-radius);
  background: var(--gray-0);
  padding: var(--padding-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.tree-flow:hover,
.tree-flow--active {
  box-shadow: 0 0 0 1px var(--primary-color);
}

.tree-flow-title {
  justify-content: space-between;
  gap: var(--padding-2);
}

.tree-flow-delete {
  flex: 0 0 44px;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.tree-flow:hover .tree-flow-delete,
.tree-flow--active .tree-flow-delete,
.tree-flow-delete:focus {
  opacity: 1;
}

.tree-flow-title strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.publish-check {
  flex: 0 0 auto;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.tree-flow p {
  margin: var(--padding-1) 0 0;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-m);
}

.canvas-title {
  min-width: 0;
}

.canvas-title h2 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-actions {
  gap: var(--padding-2);
}

.list-actions {
  flex: 0 0 auto;
  gap: var(--padding-2);
}

.workflow-canvas {
  flex: 1;
  min-height: 0;
  border-radius: var(--big-radius);
  box-shadow: inset 0 0 0 1px var(--gray-300);
  background:
    linear-gradient(90deg, var(--gray-300) 1px, transparent 1px),
    linear-gradient(0deg, var(--gray-300) 1px, transparent 1px),
    var(--gray-50);
  background-size: 28px 28px;
  overflow: hidden;
  position: relative;
}

.canvas-notice {
  position: absolute;
  top: var(--padding-3);
  left: var(--padding-3);
  right: var(--padding-3);
  z-index: 2;
  border-radius: var(--big-radius);
  background: var(--orange-50);
  color: var(--warning-color);
  box-shadow: var(--shadow-1);
  padding: var(--padding-2) var(--padding-3);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.diagram-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--padding-6);
  box-sizing: border-box;
  cursor: grab;
  user-select: none;
  touch-action: none;
  overscroll-behavior: contain;
}

.diagram-scroll--dragging {
  cursor: grabbing;
}

.flow-layout {
  position: relative;
  flex: 0 0 auto;
  margin: 0 auto;
}

.route-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 1;
}

.flow-node {
  position: absolute;
  width: 180px;
  height: 108px;
  border: 1px solid var(--gray-300);
  border-top: 3px solid var(--primary-color);
  border-radius: var(--big-radius);
  background: var(--gray-0);
  box-shadow: var(--shadow-1);
  padding: var(--padding-3);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding-2);
  text-align: center;
  cursor: pointer;
  transition: all 0.18s ease;
  z-index: 3;
}

.flow-node:hover,
.flow-node--selected {
  box-shadow: 0 0 0 2px var(--primary-color), var(--shadow-2);
}

.flow-node--disabled {
  opacity: 0.52;
}

.flow-node--start,
.flow-node--end {
  border-top-color: var(--success-color);
}

.flow-node--approvalFlow,
.flow-node--gateway {
  border-top-color: var(--warning-color);
}

.flow-node--dispatchFlow {
  border-top-color: #4f46e5;
}

.flow-node--systemTask,
.flow-node--businessFlow {
  border-top-color: var(--turquoise-500);
}

.node-main {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.node-name {
  max-width: 100%;
  color: var(--title-color);
  font-size: var(--font-l);
  line-height: var(--line-l);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.node-type-tag {
  max-width: 100%;
  min-height: 22px;
  border-radius: var(--small-radius);
  padding: 0 var(--padding-2);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  white-space: nowrap;
}

.node-type-tag--start {
  color: var(--success-color);
  background: #e9f8ef;
  border-color: #b9e8c8;
}

.node-type-tag--end {
  color: #4b5563;
  background: #f3f4f6;
  border-color: #d1d5db;
}

.node-type-tag--workStage {
  color: var(--primary-color);
  background: var(--blue-50);
  border-color: var(--blue-200);
}

.node-executor-line {
  max-width: 100%;
  min-height: 20px;
  padding: 1px var(--padding-2);
  border-radius: var(--small-radius);
  box-sizing: border-box;
  display: inline-block;
  color: var(--gray-700);
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  font-size: var(--font-sm);
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type-tag--dispatchFlow {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}

.node-type-tag--systemTask {
  color: #087a7a;
  background: #e5fbfb;
  border-color: #a7e8e8;
}

.node-type-tag--businessFlow {
  color: #7b4a00;
  background: #fff4dc;
  border-color: #f4cf89;
}

.node-type-tag--approvalFlow {
  color: var(--warning-color);
  background: var(--orange-50);
  border-color: var(--orange-100);
}

.node-type-tag--gateway {
  color: #9a3412;
  background: #fff1ed;
  border-color: #f7c4b4;
}

.custom-node-badge {
  max-width: 100%;
  min-height: 20px;
  border-radius: var(--small-radius);
  background: #f3f4f6;
  color: var(--text-color);
  border: 1px solid var(--gray-300);
  padding: 0 var(--padding-2);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  white-space: nowrap;
}

.route-link-card {
  position: absolute;
  width: 176px;
  min-height: 24px;
  border: 1px solid rgba(191, 203, 217, 0.72);
  border-radius: var(--small-radius);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.08);
  padding: 2px 8px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  z-index: 4;
}

.route-link-card strong {
  max-width: 100%;
  color: var(--title-color);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-path {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-path--forward {
  stroke-dasharray: none;
}

.route-path--reject,
.route-path--bypass {
  stroke-dasharray: 4 4;
}

.route-path {
  filter: drop-shadow(0 1px 0 rgba(36, 111, 229, 0.12));
}

.route-arrow-head {
  fill: var(--primary-color);
}

.route-link-card--reject {
  width: 196px;
}

.route-link-card--bypass {
  width: 168px;
}

.route-link--selected .route-link-card {
  color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color), var(--shadow-1);
}

.property-scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
  padding-right: var(--padding-1);
  overflow-y: auto;
}

.property-card {
  border-radius: var(--big-radius);
  background: var(--gray-0);
  box-shadow: var(--shadow-1);
  padding: var(--padding-3);
}

.property-card h3 {
  margin: 0 0 var(--padding-3);
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.workflow-name-input {
  width: 240px;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--divider-bg-color);
  border-radius: var(--big-radius);
  padding: 0 var(--padding-2);
  color: var(--title-color);
  background: var(--gray-0);
  font-size: var(--font-m);
  line-height: var(--line-m);
  outline: none;
}

.workflow-name-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 100, 255, 0.12);
}

.condition-builder {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.condition-empty-state {
  min-height: 40px;
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-1) var(--padding-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-2);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.condition-form-item {
  display: block;
}

.condition-form-item :deep(.m-form-item__label) {
  display: block;
  width: 100% !important;
  margin: 0 0 var(--padding-2);
  padding-right: 0;
}

.condition-form-item :deep(.m-form-item__content) {
  display: block;
  width: 100%;
  min-height: 0;
}

.condition-rule {
  width: 100%;
  box-sizing: border-box;
  padding: var(--padding-1);
  border-radius: var(--big-radius);
  background: var(--gray-100);
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 104px;
  align-items: center;
  gap: var(--padding-1);
  overflow: hidden;
}

.condition-rule + .condition-rule {
  margin-top: var(--padding-2);
}

.condition-relation-placeholder {
  color: var(--title-color);
}

.condition-relation-placeholder {
  display: inline-flex;
  min-height: var(--m-component-size);
  align-items: center;
  width: 100%;
  padding-left: var(--padding-2);
  box-sizing: border-box;
}

.condition-relation-cell,
.condition-field-cell,
.condition-operator-cell,
.condition-value-cell {
  min-width: 0;
}

.condition-rule :deep(.m-select),
.condition-rule :deep(.m-select-inner),
.condition-rule :deep(.m-input) {
  max-width: 100%;
}

.condition-actions,
.create-condition-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--padding-1);
  white-space: nowrap;
}

.condition-value-cell {
  grid-column: 2 / 4;
}

.condition-rule .condition-actions {
  grid-column: 1 / 4;
  justify-content: flex-end;
}

.condition-actions :deep(.m-button + .m-button),
.create-condition-actions :deep(.m-button + .m-button) {
  margin-left: 0;
}

.condition-preview {
  margin: var(--padding-2) 0 0;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.status-rule-intro {
  margin: 0 0 var(--padding-3);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.status-rule-block-head span,
.status-rule-node span,
.status-rule-picker span {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.status-rule-block + .status-rule-block {
  margin-top: var(--padding-3);
  padding-top: var(--padding-3);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
}

.status-rule-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-2);
  margin-bottom: var(--padding-2);
}

.status-rule-block-head strong,
.status-rule-node strong {
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.status-rule-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.status-rule-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  align-items: center;
  gap: var(--padding-2);
  border-radius: var(--small-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
}

.status-rule-node,
.status-rule-picker {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.status-rule-node strong,
.status-rule-node span,
.status-rule-picker span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-status-list,
.status-transition-list,
.status-condition-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.workflow-status-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px auto;
  align-items: center;
  gap: var(--padding-2);
  border-radius: var(--small-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
}

.workflow-status-row > :deep(.m-input:first-child) {
  width: 100%;
}

.workflow-status-row > :deep(.m-input:nth-child(2)) {
  width: 100%;
}

.workflow-status-row > *,
.workflow-status-row :deep(.m-input) {
  min-width: 0;
  max-width: 100%;
}

.status-transition-card {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border-radius: var(--small-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
}

.status-transition-head {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
  margin-bottom: var(--padding-2);
}

.status-transition-title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-2);
}

.status-rule-title {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.status-rule-title strong {
  min-width: 0;
  color: var(--title-color);
  font-size: var(--font-md);
  line-height: var(--line-md);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-rule-title code {
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  border-radius: 4px;
  background: var(--gray-200);
  color: var(--notes-color);
  font-family: var(--font-family);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  padding: 1px 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-rule-title span,
.status-condition-relation {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.status-transition-title-row > *,
.status-condition-row > * {
  min-width: 0;
}

.status-transition-card :deep(.m-input),
.status-transition-card :deep(.m-select) {
  min-width: 0;
  max-width: 100%;
}

.status-condition-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--padding-2);
}

.status-condition-row > :deep(.m-button) {
  justify-self: flex-end;
}

.status-transition-footer {
  margin-top: var(--padding-2);
  padding-top: var(--padding-2);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-2);
}

.status-transition-footer span {
  min-width: 0;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-list,
.strategy-subform,
.action-policy-list,
.executor-rule-list,
.config-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.node-config-section {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.node-config-section + .node-config-section {
  margin-top: var(--padding-4);
  padding-top: var(--padding-3);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
}

.stage-card,
.config-card {
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
}

.stage-card--custom {
  background: var(--gray-100);
  box-shadow: inset 0 0 0 1px var(--divider-bg-color);
}

.stage-card + .stage-card,
.config-card + .config-card {
  margin-top: var(--padding-2);
}

.property-card-head,
.node-config-section-head,
.stage-card-head,
.strategy-row,
.config-row,
.property-actions,
.node-detail-head,
.node-detail-actions {
  display: flex;
  align-items: center;
}

.property-card-head {
  justify-content: space-between;
  gap: var(--padding-2);
  margin-bottom: var(--padding-3);
}

.property-card-head h3 {
  margin: 0;
}

.node-config-section-head {
  justify-content: space-between;
  gap: var(--padding-2);
  min-height: 28px;
}

.node-config-section-head strong {
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.node-config-section-head span {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.stage-card-head {
  justify-content: space-between;
  gap: var(--padding-2);
  margin-bottom: var(--padding-2);
}

.stage-card-head strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.stage-card-head span,
.stage-warning {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.strategy-row {
  min-height: var(--m-component-size);
  justify-content: space-between;
  gap: var(--padding-3);
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.node-card-action-row {
  margin-top: var(--padding-2);
  padding-top: var(--padding-2);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
}

.node-config-actions {
  display: flex;
  align-items: center;
  gap: var(--padding-2);
  flex: 0 0 auto;
}

.assignment-subform,
.approval-config-fields {
  margin-top: var(--padding-2);
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.stage-config-fields {
  margin-top: 0;
}

.assignment-subform {
  border: 1px solid rgba(191, 203, 217, 0.56);
  border-radius: var(--small-radius);
  background: var(--gray-0);
  padding: var(--padding-2);
}

.assignment-mode-options {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--padding-1);
  flex-wrap: nowrap;
}

.assignment-mode-option {
  flex: 1 1 0;
  min-width: 0;
  height: 32px;
  border: 1px solid var(--divider-bg-color);
  border-radius: var(--small-radius);
  background: var(--gray-0);
  color: var(--title-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  white-space: nowrap;
  cursor: pointer;
}

.assignment-mode-option--active {
  border-color: var(--primary-color);
  background: rgba(25, 118, 210, 0.08);
  color: var(--primary-color);
  font-weight: 600;
}

.config-field {
  min-width: 0;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: var(--padding-2);
  color: var(--title-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.config-field--inline {
  grid-template-columns: 76px minmax(0, 1fr);
}

.config-field > span {
  color: var(--notes-color);
  white-space: nowrap;
}

.config-row {
  gap: var(--padding-1);
  display: grid;
  grid-template-columns: 92px minmax(116px, 1fr);
  overflow: visible;
}

.config-row--actions {
  display: flex;
  justify-content: flex-start;
  margin-top: var(--padding-2);
}

.config-row > :nth-child(3) {
  grid-column: 1 / 3;
}

.config-row > :nth-child(4) {
  justify-self: start;
}

.approval-name-input {
  display: block;
  margin: var(--padding-2) 0;
}

.system-node-title {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.system-node-title strong {
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.system-node-title span,
.config-card p,
.empty-hint {
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.config-card p,
.empty-hint {
  margin: var(--padding-2) 0 0;
}

.create-flow-form {
  width: 820px;
  max-width: calc(100vw - 96px);
}

.create-flow-form .condition-builder {
  max-width: 100%;
  overflow: visible;
}

.delete-flow-confirm {
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-3);
}

.delete-flow-confirm strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-l);
  line-height: var(--line-l);
}

.delete-flow-confirm p {
  margin: var(--padding-2) 0 0;
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.validation-modal {
  width: 700px;
  max-width: calc(100vw - 96px);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.validation-summary-card {
  min-height: 68px;
  border: 1px solid rgba(244, 67, 54, 0.22);
  border-radius: var(--big-radius);
  background: #fff5f5;
  padding: var(--padding-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-3);
  box-sizing: border-box;
}

.validation-summary-card--pass {
  border-color: rgba(46, 125, 50, 0.22);
  background: #f1f9f4;
}

.validation-summary-card strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-l);
  line-height: var(--line-l);
  font-weight: 600;
}

.validation-summary-card span {
  display: block;
  margin-top: var(--padding-1);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.validation-pass-state {
  border-radius: var(--big-radius);
  background: var(--gray-100);
  color: var(--title-color);
  padding: var(--padding-3);
  font-size: var(--font-m);
  line-height: 22px;
}

.validation-issue-list {
  max-height: min(52vh, 520px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
  padding-right: var(--padding-1);
}

.validation-issue-card {
  border: 1px solid var(--divider-bg-color);
  border-left-width: 4px;
  border-radius: var(--big-radius);
  background: var(--gray-0);
  padding: var(--padding-3);
}

.validation-issue-card--error {
  border-left-color: var(--danger-color, #d93025);
}

.validation-issue-card--warning {
  border-left-color: var(--warning-color);
}

.validation-issue-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--padding-3);
}

.validation-issue-head strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.validation-issue-head span {
  display: block;
  margin-top: 2px;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.validation-issue-card p {
  margin: var(--padding-2) 0 0;
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: 22px;
}

.validation-issue-card footer {
  margin-top: var(--padding-2);
  display: flex;
  justify-content: flex-end;
}

.create-condition-rule {
  width: 100%;
  min-height: 44px;
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-1);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 64px 148px 96px minmax(280px, 1fr) auto;
  align-items: center;
  gap: var(--padding-1);
  overflow: visible;
}

.create-condition-rule + .create-condition-rule {
  margin-top: var(--padding-2);
}

.strategy-subform {
  margin: var(--padding-1) 0 var(--padding-2);
}

.stage-warning {
  margin: var(--padding-2) 0 0;
}

.property-actions {
  justify-content: flex-end;
  gap: var(--padding-2);
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.node-detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(560px, calc(100vw - 16px));
  z-index: 12;
  border-radius: var(--xl-radius) 0 0 var(--xl-radius);
  background: var(--gray-100);
  box-shadow: var(--shadow-4);
  display: flex;
  flex-direction: column;
  padding: var(--padding-4);
  box-sizing: border-box;
}

.node-detail-head {
  flex: 0 0 auto;
  justify-content: space-between;
  gap: var(--padding-3);
  margin-bottom: var(--padding-3);
}

.node-detail-head h2 {
  margin: var(--padding-1) 0 0;
  color: var(--title-color);
  font-size: var(--font-xl);
  line-height: var(--line-xl);
  font-weight: 600;
}

.node-detail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
  padding-right: var(--padding-1);
}

.node-detail-actions {
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: var(--padding-2);
  margin-top: var(--padding-3);
  padding-top: var(--padding-3);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
}

.node-readonly-banner {
  flex: 0 0 auto;
  margin-bottom: var(--padding-3);
  border-radius: var(--big-radius);
  background: var(--orange-50);
  color: var(--warning-color);
  padding: var(--padding-2) var(--padding-3);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.execution-requirement-list,
.route-rule-list,
.route-impact-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.execution-requirement-row,
.route-rule-item,
.route-impact-item {
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
  box-sizing: border-box;
}

.execution-requirement-row {
  min-height: 52px;
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.execution-requirement-main,
.execution-approval-field,
.route-rule-item,
.route-impact-item {
  min-width: 0;
}

.route-rule-item,
.route-impact-item {
  position: relative;
}

.entry-logic-row {
  display: flex;
  align-items: center;
  gap: var(--padding-2);
  margin-bottom: var(--padding-2);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.execution-requirement-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-3);
}

.execution-approval-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: var(--padding-2);
  padding-top: var(--padding-2);
  box-shadow: inset 0 1px 0 var(--divider-bg-color);
}

.execution-requirement-row strong,
.route-rule-item strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.execution-requirement-row span,
.route-rule-item span {
  display: block;
  margin-top: 2px;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.route-rule-sentence {
  margin: 0;
  width: calc(100% - 84px);
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: 22px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.entry-relation-chip {
  display: inline-flex !important;
  width: 24px;
  height: 22px;
  margin: 0 var(--padding-1) 0 0 !important;
  align-items: center;
  justify-content: center;
  border-radius: var(--middle-radius);
  background: var(--gray-200);
  color: var(--notes-color) !important;
  font-size: var(--font-sm) !important;
  line-height: 22px !important;
  font-weight: 600;
  vertical-align: top;
}

.route-rule-delete {
  position: absolute;
  top: var(--padding-1);
  right: var(--padding-2);
}

.route-condition-editor {
  margin-top: var(--padding-2);
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.route-rule-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(104px, 160px) auto;
  align-items: end;
  gap: var(--padding-2);
}

.route-rule-control {
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.route-rule-control--status {
  max-width: 160px;
}

.route-rule-control span {
  margin-top: 0;
}

.route-rule-control :deep(.m-select),
.route-rule-control :deep(.m-select-inner) {
  width: 100% !important;
  min-width: 0;
}

.route-rule-controls > .m-button {
  white-space: nowrap;
}

.route-condition-empty {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.route-condition-row {
  display: grid;
  grid-template-columns: 56px minmax(110px, 1fr) minmax(84px, 0.72fr) minmax(112px, 1fr) auto;
  align-items: center;
  gap: var(--padding-1);
  overflow: visible;
}

.route-condition-relation {
  min-width: 0;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.route-generated-hint {
  margin-top: var(--padding-2);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.route-impact-item strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.route-impact-item span {
  display: block;
  margin-top: 2px;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  overflow-wrap: anywhere;
}

.data-permission-board {
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.data-permission-section {
  min-width: 0;
  border: 1px solid var(--divider-bg-color);
  border-radius: var(--big-radius);
  background: var(--gray-0);
  overflow: hidden;
}

.data-permission-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding-2);
  padding: var(--padding-2) var(--padding-3);
  border-left: 4px solid var(--primary-color);
  background: var(--gray-100);
}

.data-permission-section--readonly .data-permission-section-head {
  border-left-color: var(--success-color);
}

.data-permission-section--hidden .data-permission-section-head {
  border-left-color: var(--notes-color);
}

.data-permission-section-head strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 700;
}

.data-permission-section-head span {
  display: block;
  margin-top: 2px;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  overflow-wrap: anywhere;
}

.data-permission-section-head code {
  min-width: 28px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--middle-radius);
  background: var(--gray-0);
  color: var(--title-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  font-weight: 700;
}

.data-permission-items {
  display: flex;
  flex-direction: column;
}

.data-permission-item {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--padding-2);
  padding: var(--padding-2) var(--padding-3);
  border-top: 1px solid var(--divider-bg-color);
}

.data-permission-copy {
  min-width: 0;
}

.data-permission-copy strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
  font-weight: 600;
}

.data-permission-copy span {
  display: block;
  margin-top: 2px;
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  overflow-wrap: anywhere;
}

.data-permission-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--padding-1);
}

.data-permission-action {
  min-width: 44px;
  height: 28px;
  border: 1px solid var(--divider-bg-color);
  border-radius: var(--small-radius);
  background: var(--gray-0);
  color: var(--text-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
  cursor: pointer;
  white-space: nowrap;
}

.data-permission-action:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.data-permission-empty {
  margin: 0;
  padding: var(--padding-3);
  border-top: 1px solid var(--divider-bg-color);
  color: var(--notes-color);
  font-size: var(--font-sm);
  line-height: var(--line-sm);
}

.custom-data-item-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.execution-result-list {
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.execution-result-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--padding-2);
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
  box-sizing: border-box;
}

.execution-result-row .config-field {
  grid-template-columns: 72px minmax(0, 1fr);
}

.execution-result-row :deep(.m-input) {
  min-width: 0;
  max-width: 100%;
}

.execution-result-row :deep(.m-button) {
  white-space: nowrap;
}

.custom-data-item-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--padding-2);
  border-radius: var(--big-radius);
  background: var(--gray-100);
  padding: var(--padding-2);
  box-sizing: border-box;
}

.custom-data-item-row .config-field {
  grid-template-columns: 72px minmax(0, 1fr);
}

.custom-data-item-row .config-field:first-child {
  grid-column: 1 / -1;
}

.custom-data-item-row .config-field:nth-child(2) {
  grid-column: 1;
}

.custom-data-item-row :deep(.m-input),
.custom-data-item-row :deep(.m-select) {
  min-width: 0;
  max-width: 100%;
}

.custom-data-item-row :deep(.m-button) {
  white-space: nowrap;
}

.rule-list {
  margin: 0;
  padding-left: 18px;
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: 20px;
}

.rule-list li + li {
  margin-top: var(--padding-1);
}

.validation-item {
  align-items: flex-start;
  gap: var(--padding-2);
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: 20px;
}

.validation-item + .validation-item {
  margin-top: var(--padding-2);
}
</style>
