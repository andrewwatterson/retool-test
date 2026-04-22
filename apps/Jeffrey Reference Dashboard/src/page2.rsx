<Screen
  id="page2"
  _customShortcuts={[]}
  _hashParams={[]}
  _order={0}
  _searchParams={[]}
  browserTitle=""
  title="Page 1"
  urlSlug=""
  uuid="fea3a05b-4076-413e-9e95-e95af87f668f"
>
  <State
    id="emailCampaignsData2"
    value={
      '[{"id":1,"subject":"March Newsletter - Product Updates","send_date":"2025-03-02","open_rate":38,"click_through_rate":12,"bounce_rate":1.5,"status":"Completed","campaign_type":"Newsletter","total_sent":5200,"total_opens":1976,"total_clicks":624,"total_bounces":78},{"id":2,"subject":"Spring Sale 20% Off","send_date":"2025-03-10","open_rate":46,"click_through_rate":18,"bounce_rate":2.1,"status":"Completed","campaign_type":"Promotional","total_sent":8400,"total_opens":3864,"total_clicks":1512,"total_bounces":177},{"id":3,"subject":"Security Alert: New Login","send_date":"2025-03-15","open_rate":62,"click_through_rate":8,"bounce_rate":0.4,"status":"Completed","campaign_type":"Transactional","total_sent":12000,"total_opens":7440,"total_clicks":960,"total_bounces":48},{"id":4,"subject":"Welcome to Acme!","send_date":"2025-03-18","open_rate":71,"click_through_rate":15,"bounce_rate":0.8,"status":"Completed","campaign_type":"Transactional","total_sent":3100,"total_opens":2201,"total_clicks":465,"total_bounces":25},{"id":5,"subject":"End of Quarter Offer - Last Chance","send_date":"2025-03-28","open_rate":41,"click_through_rate":16,"bounce_rate":2.9,"status":"Completed","campaign_type":"Promotional","total_sent":7600,"total_opens":3116,"total_clicks":1216,"total_bounces":220},{"id":6,"subject":"April Newsletter - Customer Stories","send_date":"2025-04-04","open_rate":36,"click_through_rate":10,"bounce_rate":1.2,"status":"Completed","campaign_type":"Newsletter","total_sent":5400,"total_opens":1944,"total_clicks":540,"total_bounces":65},{"id":7,"subject":"Feature Launch: Advanced Reporting","send_date":"2025-04-11","open_rate":52,"click_through_rate":21,"bounce_rate":1.0,"status":"Completed","campaign_type":"Announcement","total_sent":6800,"total_opens":3536,"total_clicks":1428,"total_bounces":68},{"id":8,"subject":"Abandoned Cart Reminder","send_date":"2025-04-17","open_rate":58,"click_through_rate":19,"bounce_rate":0.6,"status":"Completed","campaign_type":"Transactional","total_sent":4300,"total_opens":2494,"total_clicks":817,"total_bounces":26},{"id":9,"subject":"VIP Early Access Sale","send_date":"2025-04-25","open_rate":49,"click_through_rate":24,"bounce_rate":1.9,"status":"Completed","campaign_type":"Promotional","total_sent":3900,"total_opens":1911,"total_clicks":936,"total_bounces":74},{"id":10,"subject":"May Newsletter - Roadmap Preview","send_date":"2025-05-03","open_rate":39,"click_through_rate":11,"bounce_rate":1.1,"status":"Completed","campaign_type":"Newsletter","total_sent":5600,"total_opens":2184,"total_clicks":616,"total_bounces":62},{"id":11,"subject":"Referral Program Launch","send_date":"2025-05-08","open_rate":44,"click_through_rate":17,"bounce_rate":1.4,"status":"Completed","campaign_type":"Announcement","total_sent":6100,"total_opens":2684,"total_clicks":1037,"total_bounces":85},{"id":12,"subject":"System Maintenance Notice","send_date":"2025-05-12","open_rate":57,"click_through_rate":6,"bounce_rate":0.5,"status":"Completed","campaign_type":"Announcement","total_sent":7200,"total_opens":4104,"total_clicks":432,"total_bounces":36},{"id":13,"subject":"Flash Sale - 24 Hours Only","send_date":"2025-05-20","open_rate":43,"click_through_rate":20,"bounce_rate":3.2,"status":"Completed","campaign_type":"Promotional","total_sent":8000,"total_opens":3440,"total_clicks":1600,"total_bounces":256},{"id":14,"subject":"Onboarding Tips & Best Practices","send_date":"2025-05-26","open_rate":48,"click_through_rate":14,"bounce_rate":0.9,"status":"Completed","campaign_type":"Newsletter","total_sent":4500,"total_opens":2160,"total_clicks":630,"total_bounces":41},{"id":15,"subject":"June Product Webinar Invite","send_date":"2025-05-30","open_rate":51,"click_through_rate":19,"bounce_rate":1.7,"status":"Scheduled","campaign_type":"Announcement","total_sent":5000,"total_opens":2550,"total_clicks":950,"total_bounces":85}]'
    }
  />
  <JavascriptQuery
    id="refreshMockData2"
    notificationDuration={4.5}
    query={include("../lib/refreshMockData2.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <Function
    id="engagementTrendData2"
    funcBody={include("../lib/engagementTrendData2.js", "string")}
  />
  <Function
    id="statusDistributionData2"
    funcBody={include("../lib/statusDistributionData2.js", "string")}
  />
  <Function
    id="kpiMetrics2"
    funcBody={include("../lib/kpiMetrics2.js", "string")}
  />
  <JavascriptQuery
    id="exportCampaignsCsv2"
    notificationDuration={4.5}
    query={include("../lib/exportCampaignsCsv2.js", "string")}
    resourceName="JavascriptQuery"
    showSuccessToaster={false}
  />
  <Function
    id="filteredCampaignsData2"
    funcBody={include("../lib/filteredCampaignsData2.js", "string")}
  />
  <Include src="./header.rsx" />
  <Frame
    id="$main2"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    type="main"
  >
    <DateRange
      id="dateRangeFilter4"
      dateFormat="MMM d, yyyy"
      endPlaceholder="End date"
      iconBefore="bold/interface-calendar-remove"
      label=""
      labelPosition="top"
      startPlaceholder="Start date"
      textBetween="-"
      value={{ start: "", end: "" }}
    />
    <Select
      id="campaignTypeFilter4"
      allowDeselect={true}
      data="{{ Array.from(new Set((emailCampaignsData2.value || []).map(c => c.campaign_type))).filter(Boolean).sort() }}"
      emptyMessage="No options"
      label=""
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
    <Button id="clearFiltersButton4" styleVariant="outline" text="Clear">
      <Event
        event="click"
        method="run"
        params={{
          map: {
            src: "dateRangeFilter4.resetValue();\ncampaignTypeFilter.resetValue();",
          },
        }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Divider id="divider1" />
    <Container
      id="openRateCard2"
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
          id="openRateKpi2"
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
          value="{{ kpiMetrics2.value.averageOpenRate / 100 }}"
        />
        <Icon
          id="openRateIcon2"
          horizontalAlign="right"
          icon="line/mail-inbox-envelope-check"
          style={{ map: { background: "#dde8c6" } }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="clickThroughRateCard2"
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
          id="clickThroughRateKpi2"
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
          value="{{ kpiMetrics2.value.averageClickRate }}"
        />
        <Icon
          id="clickRateIcon2"
          horizontalAlign="right"
          icon="line/interface-cursor-hand"
          style={{ map: { background: "#e8d6c6" } }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="bounceRateCard2"
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
          id="bounceRateKpi2"
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
          value="{{ kpiMetrics2.value.averageBounceRate / 100 }}"
        />
        <Icon
          id="bounceRateIcon2"
          horizontalAlign="right"
          icon="line/interface-alert-warning-circle"
          style={{ map: { background: "#d8a7e0" } }}
          styleVariant="background"
        />
      </View>
    </Container>
    <Container
      id="engagementTrendCard2"
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
          id="engagementChartTitle2"
          value="#### Engagement Trends"
          verticalAlign="center"
        />
        <Chart
          id="engagementTrendChart2"
          barMode="group"
          barOrientation=""
          chartType="line"
          clearOnEmptyData={true}
          selectedPoints="[]"
          stackedBarTotalsDataLabelPosition="none"
          title={null}
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
            lineColor="#e8d6c6"
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
            xData="{{ engagementTrendData2.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData2.value.map(d => d.open_rate) }}"
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
            lineColor="#d8a7e0"
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
            xData="{{ engagementTrendData2.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData2.value.map(d => d.click_through_rate) }}"
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
            lineColor="#afc7e6"
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
            xData="{{ engagementTrendData2.value.map(d => d.date) }}"
            xDataMode="manual"
            yAxis="y"
            yData="{{ engagementTrendData2.value.map(d => d.bounce_rate) }}"
            yDataMode="manual"
            zData="[1, 2, 3, 4, 5]"
            zDataMode="manual"
          />
        </Chart>
      </View>
    </Container>
    <Container
      id="campaignStatusCard2"
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
          id="statusChartTitle2"
          value="#### Campaign Status"
          verticalAlign="center"
        />
        <Chart
          id="campaignStatusChart2"
          chartType="pie"
          clearOnEmptyData={true}
          colorArray={
            '["#E8C6D0", "#C6DDE8", "#DDE8C6", "#E8D6C6", "#D8A7E0", "#AFC7E6"]'
          }
          colorArrayDropDown={[
            "#11B5AE",
            "#4046CA",
            "#F68512",
            "#DE3C82",
            "#7E84FA",
            "#72E06A",
          ]}
          datasource=""
          datasourceMode="source"
          gradientColorArray={[
            ["0.0", "{{ theme.canvas }}"],
            ["1.0", "{{ theme.primary }}"],
          ]}
          hoverTemplate="%{label}<br>%{value}<br>%{percent}<extra></extra>"
          hoverTemplateMode="source"
          labelData="{{ statusDistributionData2.value.map(r => r.status) }}"
          lineColor="{{ theme.surfacePrimary }}"
          lineWidth={2}
          pieDataHole={0.4}
          selectedPoints="[]"
          textTemplateMode="source"
          textTemplatePosition="outside"
          title={null}
          valueData="{{ statusDistributionData2.value.map(r => r.count) }}"
        />
      </View>
    </Container>
    <Table
      id="campaignsTable2"
      cellSelection="none"
      clearChangesetOnSave={true}
      data="{{ filteredCampaignsData2.value }}"
      defaultSelectedRow={{ mode: "none", indexType: "display", index: 0 }}
      emptyMessage="No rows found"
      enableSaveActions={true}
      primaryKeyColumnId="b2aa7"
      rowHeight="medium"
      showBorder={true}
      showFooter={true}
      showHeader={true}
      style={{
        rowSeparator: "rgb(226, 232, 240)",
        border: "rgba(0, 0, 0, 0)",
        background: "canvas",
      }}
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
          pluginId="campaignsTable2"
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
          pluginId="campaignsTable2"
          type="widget"
          waitMs="0"
          waitType="debounce"
        />
      </ToolbarButton>
    </Table>
  </Frame>
</Screen>
