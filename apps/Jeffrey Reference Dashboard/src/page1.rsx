<Screen
  id="page1"
  _customShortcuts={[]}
  _hashParams={[]}
  _order={0}
  _searchParams={[]}
  browserTitle=""
  title="Page 1"
  urlSlug=""
  uuid="db955276-8600-47ed-a950-ad6b40d3ff2c"
>
  <Function
    id="filteredCampaignsData"
    funcBody={include("../lib/filteredCampaignsData.js", "string")}
  />
  <Function
    id="kpiMetrics"
    funcBody={include("../lib/kpiMetrics.js", "string")}
  />
  <Function
    id="engagementTrendData"
    funcBody={include("../lib/engagementTrendData.js", "string")}
  />
  <Function
    id="statusDistributionData"
    funcBody={include("../lib/statusDistributionData.js", "string")}
  />
  <JavascriptQuery
    id="exportCampaignsCsv"
    notificationDuration={4.5}
    query={include("../lib/exportCampaignsCsv.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <JavascriptQuery
    id="refreshMockData"
    notificationDuration={4.5}
    query={include("../lib/refreshMockData.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <Frame
    id="$main"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    type="main"
  >
    <Text
      id="appTitle"
      value="# Spicy Changed Dashboard"
      verticalAlign="center"
    />
    <Button
      id="exportButton"
      style={{ map: { borderRadius: "8px" } }}
      text="Export"
    >
      <Event
        event="click"
        method="run"
        params={{ map: { src: "exportCampaignsCsv.trigger();" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Button id="refreshButton" styleVariant="outline" text="Refresh">
      <Event
        event="click"
        method="run"
        params={{ map: { src: "refreshMockData.trigger();" } }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Container
      id="filterContainer"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <DateRange
          id="dateRangeFilter"
          dateFormat="MMM d, yyyy"
          endPlaceholder="End date"
          iconBefore="bold/interface-calendar-remove"
          label="Date range"
          labelPosition="top"
          startPlaceholder="Start date"
          textBetween="-"
          value={{ start: "", end: "" }}
        />
        <Select
          id="campaignTypeFilter"
          allowDeselect={true}
          data="{{ Array.from(new Set((emailCampaignsData.value || []).map(c => c.campaign_type))).filter(Boolean).sort() }}"
          emptyMessage="No options"
          label="Campaign type"
          labelPosition="top"
          labels="{{ item }}"
          overlayMaxHeight={375}
          placeholder="All campaign types"
          showClear={true}
          showSelectionIndicator={true}
          values="{{ item }}"
        >
          <Option id="00030" value="Option 1" />
          <Option id="00031" value="Option 2" />
          <Option id="00032" value="Option 3" />
        </Select>
        <Button id="clearFiltersButton" styleVariant="outline" text="Clear">
          <Event
            event="click"
            method="run"
            params={{
              map: {
                src: "dateRangeFilter.resetValue();\ncampaignTypeFilter.resetValue();",
              },
            }}
            pluginId=""
            type="script"
            waitMs="0"
            waitType="debounce"
          />
        </Button>
      </View>
    </Container>
    <Container
      id="openRateCard"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="openRateKpi"
          currency="USD"
          decimalPlaces={1}
          formattingStyle="percent"
          label="Average open rate"
          labelCaption="Over selected period"
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryDecimalPlaces={1}
          secondaryFormattingStyle="percent"
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          value="{{ kpiMetrics.value.averageOpenRate / 100 }}"
        />
        <Icon
          id="openRateIcon"
          horizontalAlign="right"
          icon="line/mail-inbox-envelope-check"
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="clickThroughRateCard"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="clickThroughRateKpi"
          currency="USD"
          decimalPlaces={1}
          formattingStyle="percent"
          label="Click rate"
          labelCaption="Average across selected period"
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          showSeparators={true}
          value="{{ kpiMetrics.value.averageClickRate }}"
        />
        <Icon
          id="clickRateIcon"
          horizontalAlign="right"
          icon="line/interface-cursor-hand"
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="bounceRateCard"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Statistic
          id="bounceRateKpi"
          currency="USD"
          decimalPlaces={1}
          formattingStyle="percent"
          label="Average bounce rate"
          labelCaption="Average over selected period"
          positiveTrend="{{ self.value >= 0 }}"
          secondaryCurrency="USD"
          secondaryDecimalPlaces={1}
          secondaryFormattingStyle="percent"
          secondaryPositiveTrend="{{ self.secondaryValue >= 0 }}"
          secondaryShowSeparators={true}
          secondaryValue=""
          showSeparators={true}
          value="{{ kpiMetrics.value.averageBounceRate / 100 }}"
        />
        <Icon
          id="bounceRateIcon"
          horizontalAlign="right"
          icon="line/interface-alert-warning-circle"
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="engagementTrendCard"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="engagementChartTitle"
          value="#### Engagement Trends"
          verticalAlign="center"
        />
        <Chart
          id="engagementTrendChart"
          barMode="group"
          barOrientation=""
          chartType="line"
          clearOnEmptyData={true}
          selectedPoints="[]"
          stackedBarTotalsDataLabelPosition="none"
          title="Engagement rates over time"
          xAxisLineWidth={1}
          xAxisRangeMax=""
          xAxisRangeMin=""
          xAxisShowLine={true}
          xAxisShowTickLabels={true}
          xAxisTickFormatMode="gui"
          xAxisTitle="Date"
          xAxisTitleStandoff={20}
          yAxis2LineWidth={1}
          yAxis2RangeMax=""
          yAxis2RangeMin=""
          yAxis2ShowTickLabels={true}
          yAxis2TickFormatMode="gui"
          yAxis2TitleStandoff={20}
          yAxisGrid={true}
          yAxisLineWidth={1}
          yAxisRangeMax=""
          yAxisRangeMin=""
          yAxisShowTickLabels={true}
          yAxisTickFormatMode="gui"
          yAxisTitle="Engagement rate (%)"
          yAxisTitleStandoff={20}
        >
          <Series
            id="0"
            aggregationType="none"
            colorArray={{ array: [] }}
            colorArrayDropDown={{ array: [] }}
            colorInputMode="gradientColorArray"
            connectorLineColor="#000000"
            dataLabelPosition="none"
            datasourceMode="manual"
            decreasingBorderColor="#000000"
            decreasingColor="#000000"
            filteredGroupsMode="source"
            gradientColorArray={{ array: [{ array: [] }] }}
            groupBy={{ array: [] }}
            groupByDropdownType="manual"
            groupByStyles={{}}
            hidden={false}
            hiddenMode="source"
            hoverTemplateArray={{ array: [] }}
            hoverTemplateMode="manual"
            increasingBorderColor="#000000"
            increasingColor="#000000"
            lineColor="#1f77b4"
            lineDash="solid"
            lineShape="linear"
            lineUnderFillMode="none"
            lineWidth={2}
            markerBorderColor="#ffffff"
            markerBorderWidth={1}
            markerColor="#1f77b4"
            markerSize={6}
            markerSymbol="circle"
            name="Open rate"
            showMarkers={false}
            textTemplateMode="manual"
            type="line"
            waterfallBase={0}
            waterfallMeasures={{ array: [] }}
            waterfallMeasuresMode="source"
            xData="{{ engagementTrendData.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData.value.map(d => d.open_rate) }}"
            yDataMode="manual"
            zData="[1, 2, 3, 4, 5]"
            zDataMode="manual"
          />
          <Series
            id="1"
            aggregationType="none"
            colorArray={{ array: [] }}
            colorArrayDropDown={{ array: [] }}
            colorInputMode="gradientColorArray"
            connectorLineColor="#000000"
            dataLabelPosition="none"
            datasourceMode="manual"
            decreasingBorderColor="#000000"
            decreasingColor="#000000"
            filteredGroupsMode="source"
            gradientColorArray={{ array: [{ array: [] }] }}
            groupBy={{ array: [] }}
            groupByDropdownType="manual"
            groupByStyles={{}}
            hidden={false}
            hiddenMode="source"
            hoverTemplateArray={{ array: [] }}
            hoverTemplateMode="manual"
            increasingBorderColor="#000000"
            increasingColor="#000000"
            lineColor="#ff7f0e"
            lineDash="solid"
            lineShape="linear"
            lineUnderFillMode="none"
            lineWidth={2}
            markerBorderColor="#ffffff"
            markerBorderWidth={1}
            markerColor="#ff7f0e"
            markerSize={6}
            markerSymbol="circle"
            name="Click rate"
            showMarkers={false}
            textTemplateMode="manual"
            type="line"
            waterfallBase={0}
            waterfallMeasures={{ array: [] }}
            waterfallMeasuresMode="source"
            xData="{{ engagementTrendData.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData.value.map(d => d.click_through_rate) }}"
            yDataMode="manual"
            zData="[1, 2, 3, 4, 5]"
            zDataMode="manual"
          />
          <Series
            id="2"
            aggregationType="none"
            colorArray={{ array: [] }}
            colorArrayDropDown={{ array: [] }}
            colorInputMode="gradientColorArray"
            connectorLineColor="#000000"
            dataLabelPosition="none"
            datasourceMode="manual"
            decreasingBorderColor="#000000"
            decreasingColor="#000000"
            filteredGroupsMode="source"
            gradientColorArray={{ array: [{ array: [] }] }}
            groupBy={{ array: [] }}
            groupByDropdownType="manual"
            groupByStyles={{}}
            hidden={false}
            hiddenMode="source"
            hoverTemplateArray={{ array: [] }}
            hoverTemplateMode="manual"
            increasingBorderColor="#000000"
            increasingColor="#000000"
            lineColor="#2ca02c"
            lineDash="solid"
            lineShape="linear"
            lineUnderFillMode="none"
            lineWidth={2}
            markerBorderColor="#ffffff"
            markerBorderWidth={1}
            markerColor="#2ca02c"
            markerSize={6}
            markerSymbol="circle"
            name="Bounce rate"
            showMarkers={false}
            textTemplateMode="manual"
            type="line"
            waterfallBase={0}
            waterfallMeasures={{ array: [] }}
            waterfallMeasuresMode="source"
            xData="{{ engagementTrendData.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData.value.map(d => d.bounce_rate) }}"
            yDataMode="manual"
            zData="[1, 2, 3, 4, 5]"
            zDataMode="manual"
          />
        </Chart>
      </View>
    </Container>
    <Container
      id="campaignStatusCard"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="statusChartTitle"
          value="#### Campaign Status"
          verticalAlign="center"
        />
        <Chart
          id="campaignStatusChart"
          chartType="pie"
          clearOnEmptyData={true}
          colorArray={[
            "#11B5AE",
            "#4046CA",
            "#F68512",
            "#DE3C82",
            "#7E84FA",
            "#72E06A",
          ]}
          colorArrayDropDown={[
            "#11B5AE",
            "#4046CA",
            "#F68512",
            "#DE3C82",
            "#7E84FA",
            "#72E06A",
          ]}
          colorInputMode="colorArrayDropDown"
          datasource=""
          datasourceMode="source"
          gradientColorArray={[
            ["0.0", "{{ theme.canvas }}"],
            ["1.0", "{{ theme.primary }}"],
          ]}
          hoverTemplate="%{label}<br>%{value}<br>%{percent}<extra></extra>"
          hoverTemplateMode="source"
          labelData="{{ statusDistributionData.value.map(r => r.status) }}"
          lineColor="{{ theme.surfacePrimary }}"
          lineWidth={2}
          pieDataHole={0.4}
          selectedPoints="[]"
          textTemplateMode="source"
          textTemplatePosition="outside"
          title="Campaigns by Status"
          valueData="{{ statusDistributionData.value.map(r => r.count) }}"
        />
      </View>
    </Container>
    <Container
      id="tableContainer"
      footerPadding="4px 12px"
      headerPadding="4px 12px"
      padding="12px"
      showBody={true}
      style={{
        border: "surfacePrimaryBorder",
        borderRadius: "12px",
        boxShadow: "lowElevation",
      }}
    >
      <View id="00030" viewKey="View 1">
        <Text
          id="tableTitle"
          value="#### Email Campaigns"
          verticalAlign="center"
        />
        <Table
          id="campaignsTable"
          cellSelection="none"
          clearChangesetOnSave={true}
          data="{{ filteredCampaignsData.value }}"
          defaultSelectedRow={{ mode: "none", indexType: "display", index: 0 }}
          emptyMessage="No rows found"
          enableSaveActions={true}
          primaryKeyColumnId="b2aa7"
          rowHeight="medium"
          showBorder={true}
          showFooter={true}
          showHeader={true}
          style={{ rowSeparator: "rgb(226, 232, 240)" }}
          toolbarPosition="bottom"
        >
          <Column
            id="b2aa7"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: false }}
            groupAggregationMode="none"
            hidden="true"
            key="id"
            label="ID"
            position="center"
            referenceId="id"
            size={80}
            summaryAggregationMode="none"
          />
          <Column
            id="7ac8c"
            alignment="left"
            cellTooltipMode="overflow"
            editableOptions={{ spellCheck: false }}
            format="string"
            groupAggregationMode="none"
            key="subject"
            label="Subject"
            position="center"
            referenceId="subject"
            size={260}
            summaryAggregationMode="none"
          />
          <Column
            id="bea2c"
            alignment="left"
            format="date"
            formatOptions={{ dateFormat: "MMM d, yyyy" }}
            groupAggregationMode="none"
            key="send_date"
            label="Send date"
            position="center"
            referenceId="send_date"
            size={140}
            summaryAggregationMode="none"
          />
          <Column
            id="6b1e4"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: false }}
            groupAggregationMode="none"
            key="open_rate"
            label="Open rate"
            position="center"
            referenceId="open_rate"
            size={120}
            sortMode="rawValue"
            summaryAggregationMode="none"
            valueOverride="{{ typeof item === 'number' ? (item * 100).toFixed(1) + '%' : '' }}"
          />
          <Column
            id="a7668"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: false }}
            groupAggregationMode="none"
            key="click_through_rate"
            label="Click rate"
            position="center"
            referenceId="click_through_rate"
            size={120}
            sortMode="rawValue"
            summaryAggregationMode="none"
            valueOverride="{{ typeof item === 'number' ? (item * 100).toFixed(1) + '%' : '' }}"
          />
          <Column
            id="41058"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: false }}
            groupAggregationMode="none"
            key="bounce_rate"
            label="Bounce rate"
            position="center"
            referenceId="bounce_rate"
            size={120}
            sortMode="rawValue"
            summaryAggregationMode="none"
            valueOverride="{{ typeof item === 'number' ? (item * 100).toFixed(1) + '%' : '' }}"
          />
          <Column
            id="b58c4"
            alignment="left"
            format="tag"
            formatOptions={{ automaticColors: true }}
            groupAggregationMode="none"
            key="status"
            label="Status"
            position="center"
            referenceId="status"
            size={120}
            sortMode="optionList"
            summaryAggregationMode="none"
          />
          <Column
            id="07249"
            alignment="left"
            format="tag"
            formatOptions={{ automaticColors: true }}
            groupAggregationMode="none"
            key="campaign_type"
            label="Campaign type"
            position="center"
            referenceId="campaign_type"
            size={140}
            sortMode="optionList"
            summaryAggregationMode="none"
          />
          <Column
            id="7e0e8"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: true }}
            groupAggregationMode="none"
            key="total_sent"
            label="Total sent"
            position="center"
            referenceId="total_sent"
            size={120}
            summaryAggregationMode="none"
          />
          <Column
            id="9ee1d"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: true }}
            groupAggregationMode="none"
            hidden="true"
            key="total_opens"
            label="Total opens"
            position="center"
            referenceId="total_opens"
            size={120}
            summaryAggregationMode="none"
          />
          <Column
            id="57f87"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: true }}
            groupAggregationMode="none"
            hidden="true"
            key="total_clicks"
            label="Total clicks"
            position="center"
            referenceId="total_clicks"
            size={120}
            summaryAggregationMode="none"
          />
          <Column
            id="36ec7"
            alignment="right"
            editableOptions={{ showStepper: true }}
            format="decimal"
            formatOptions={{ showSeparators: true }}
            groupAggregationMode="none"
            hidden="true"
            key="total_bounces"
            label="Total bounces"
            position="center"
            referenceId="total_bounces"
            size={120}
            summaryAggregationMode="none"
          />
          <ToolbarButton
            id="1a"
            icon="bold/interface-text-formatting-filter-2"
            label="Filter"
            type="filter"
          />
          <ToolbarButton
            id="3c"
            icon="bold/interface-download-button-2"
            label="Download"
            type="custom"
          >
            <Event
              event="clickToolbar"
              method="exportData"
              pluginId="campaignsTable"
              type="widget"
              waitMs="0"
              waitType="debounce"
            />
          </ToolbarButton>
          <ToolbarButton
            id="4d"
            icon="bold/interface-arrows-round-left"
            label="Refresh"
            type="custom"
          >
            <Event
              event="clickToolbar"
              method="refresh"
              pluginId="campaignsTable"
              type="widget"
              waitMs="0"
              waitType="debounce"
            />
          </ToolbarButton>
        </Table>
      </View>
    </Container>
  </Frame>
</Screen>
