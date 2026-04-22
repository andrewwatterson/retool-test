<Frame
  id="$header"
  enableFullBleed={null}
  isHiddenOnDesktop={false}
  isHiddenOnMobile={true}
  padding="16px 12px"
  sticky={true}
  type="header"
>
  <Text
    id="appTitle2"
    value="# Email Analytics Dashboard"
    verticalAlign="center"
  />
  <Button id="refreshButton2" styleVariant="outline" text="Refresh">
    <Event
      event="click"
      method="run"
      params={{ map: { src: "refreshMockData2.trigger();" } }}
      pluginId=""
      type="script"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Button
    id="exportButton3"
    style={{ map: { borderRadius: "8px" } }}
    text="Export"
  >
    <Event
      event="click"
      method="run"
      params={{ map: { src: "exportCampaignsCsv2.trigger();" } }}
      pluginId=""
      type="script"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
</Frame>
