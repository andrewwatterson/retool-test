<Container
  id="container1"
  _direction="vertical"
  _gap="4px
"
  footerPadding="4px 12px"
  headerPadding="4px 12px"
  padding="12px"
  showBody={true}
  style={{ map: { boxShadow: "mediumElevation" } }}
>
  <Header>
    <Text id="containerTitle1" value="#### {{ item }}" verticalAlign="center" />
  </Header>
  <View id="00030" viewKey="View 1">
    <Text
      id="text1"
      style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter" }}
      value=" {{ item.subject }}"
      verticalAlign="center"
    />
    <Text
      id="text2"
      style={{ fontSize: "28px\n", fontWeight: "700", fontFamily: "Inter" }}
      value=" {{ item.total_opens }}"
      verticalAlign="center"
    />
    <Text
      id="text4"
      style={{
        fontSize: "14px\n",
        fontWeight: "500",
        fontFamily: "Inter",
        color: "rgba(137, 137, 137, 1)",
      }}
      value="opens"
      verticalAlign="center"
    />
    <TagsWidget2
      id="tags1"
      _colorByIndex={["{{ theme.primary }}"]}
      _hiddenByIndex={[false]}
      _iconByIndex={[""]}
      _ids={["ccf94"]}
      _imageByIndex={[""]}
      _labels={["{{ item.campaign_type }}"]}
      _textColorByIndex={[""]}
      _tooltipByIndex={[""]}
      _values={["Tag 1"]}
      allowWrap={true}
      colorByIndex=""
      data=""
      hiddenByIndex=""
      iconByIndex=""
      imageByIndex=""
      itemMode="static"
      labels=""
      textColorByIndex=""
      tooltipByIndex=""
      value=""
      values=""
    />
  </View>
</Container>
