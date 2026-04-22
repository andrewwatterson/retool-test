<Screen
  id="page3"
  _customShortcuts={[]}
  _hashParams={[]}
  _order={2}
  _searchParams={[]}
  browserTitle={null}
  title={null}
  urlSlug={null}
  uuid="48b1dd89-254c-4f90-9a6c-51a371b722eb"
>
  <Frame
    id="$main3"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  >
    <ListViewBeta
      id="listView1"
      _primaryKeys="{{ item.id }}"
      data="{{ emailCampaignsData.value }}"
      itemWidth="200px"
      margin="0"
      numColumns={3}
      padding="0"
    >
      <Include src="./container1.rsx" />
    </ListViewBeta>
  </Frame>
</Screen>
