import { shallow } from 'vue-test-utils';
import {chatConstants} from '../../main/webapp/vue-app/chatConstants.js';

import ExoChatContact from '../../main/webapp/vue-app/components/ExoChatContact';
import ExoChatRoomDetail from '../../main/webapp/vue-app/components/ExoChatRoomDetail';
import ExoDropdownSelect from '../../main/webapp/vue-app/components/ExoDropdownSelect';
import ExoChatRoomNotificationModal from '../../main/webapp/vue-app/components/modal/ExoChatRoomNotificationModal';
import ExoChatModal from '../../main/webapp/vue-app/components/modal/ExoChatModal';

describe('ExoChatRoomDetail.test.js', () => {
  let roomDetail;
  const room = {
    fullName: 'test room',
    unreadTota: 0,
    isActive: 'true',
    type: 't',
    user: 'team-a11192fa4a461dc023ac8b6d1cd85951a385d418',
    room: 'a11192fa4a461dc023ac8b6d1cd85951a385d418',
    admins: ['root'],
    status: 'team',
    timestamp: 1528897226090,
    isFavorite: true
  };

  const user = {
    fullName: 'John Smith',
    unreadTota: 0,
    isActive: 'true',
    type: 'u',
    user: 'smith',
    room: 'a11192fa4a461dc023ac8b6d1cd85951a385d419',
    status: 'away',
    timestamp: 1528897226090,
    isFavorite: false
  };

  const space = {
    fullName: 'My space',
    unreadTota: 0,
    isActive: 'true',
    type: 's',
    user: 'space-a11192fa4a461dc023ac8b6d1cd85951a385d417',
    room: 'a11192fa4a461dc023ac8b6d1cd85951a385d417',
    status: 'space',
    timestamp: 1528897226090,
    isFavorite: false
  };

  const confirmMock = jest.fn();
  const testAction = {
    key: 'test',
    labelKey: 'Test',
    type: 't',
    class: 'uiIconTest',
    confirm: {
      title: 'Test comfirmation',
      message: 'Comfirm the test',
      okMessage: 'ok',
      koMessage: 'cancel',
      confirmed: confirmMock
    },
    enabled: (comp) => {
      return comp.isAdmin;
    }
  };

  const extraActions = extensionRegistry.loadExtensions('chat', 'room-action');

  beforeEach(() => {
    roomDetail = shallow(ExoChatRoomDetail, {
      propsData: {
        contact : room
      },
      stubs: {
        'exo-chat-contact': ExoChatContact,
        'exo-chat-room-notification-modal': ExoChatRoomNotificationModal,
        'exo-chat-modal': ExoChatModal,
        'exo-dropdown-select': ExoDropdownSelect
      },
      mocks: {
        $t: () => {},
        $constants : chatConstants
      },
      attachToDocument: true
    });
  });


  it('Room detail contain contact', () => {
    expect(roomDetail.contains('.chat-contact')).toBe(true);
  });

  it('contact has is-fav class when room is favorite', () => {
    expect(roomDetail.find('.favorite').classes()).toContain('is-fav');
  });

  it('open room notification modal', () => {
    const vm = roomDetail.vm;
    // modal must be closed: openNotificationSettings = false
    expect(vm.openNotificationSettings).toBe(false);
    // trigger open room setting event
    roomDetail.trigger(vm.$constants.ACTION_ROOM_OPEN_SETTINGS);
    // modal must be opned: openNotificationSettings = true
    expect(vm.openNotificationSettings).toBe(true);
  });

  it('open search area when click on loop icon', () => {
    const searchButton = roomDetail.find('.room-search-btn');
    const vm = roomDetail.vm;
    // check search icon exist
    expect(searchButton.exists()).toBe(true);
    // search input must be hidden
    expect(vm.showSearchRoom).toBe(false);
    // trigger search icon click
    searchButton.trigger('click');
    // search input must be visible
    expect(vm.showSearchRoom).toBe(true);
    expect(roomDetail.find('.room-actions-container').classes()).toContain('search-active');
  });

  it('close search area when click on close icon', () => {
    const closeButton = roomDetail.find('.room-search i');
    const vm = roomDetail.vm;
    vm.openSearchRoom();
    expect(vm.showSearchRoom).toBe(true);
    closeButton.trigger('click');
    expect(vm.showSearchRoom).toBe(false);
  });

  it('close search area when click on blur', () => {
    const searchInput = roomDetail.find('.room-search input');
    const vm = roomDetail.vm;
    vm.openSearchRoom();
    expect(vm.showSearchRoom).toBe(true);
    searchInput.trigger('blur');
    expect(vm.showSearchRoom).toBe(false);
  });

  it('close search area must still displayed on blur when the seach field is filled', () => {
    const searchInput = roomDetail.find('.room-search input');
    const vm = roomDetail.vm;
    vm.openSearchRoom();
    expect(vm.showSearchRoom).toBe(true);
    // fill the search input with text
    vm.searchText = 'test';
    searchInput.trigger('blur');
    expect(vm.showSearchRoom).toBe(true);
  });

  it('close search area when click on esc key press', () => {
    const searchInput = roomDetail.find('.room-search input');
    const vm = roomDetail.vm;
    vm.openSearchRoom();
    expect(vm.showSearchRoom).toBe(true);
    searchInput.trigger('keyup.esc');
    expect(vm.showSearchRoom).toBe(false);
  });

  it('room actions list must contain extra actions', () => {
    const vm = roomDetail.vm;
    expect(vm.settingActions).toHaveLength(extraActions.length);
  });

  it('click on action list elemnt with comfirmation', () => {
    const vm = roomDetail.vm;
    vm.settingActions = [testAction];
    roomDetail.update();
    const action = roomDetail.find('.chat-team-button-dropdown .dropdown-menu li');
    const okButton = roomDetail.find('#team-delete-button-ok');
  
    expect(vm.settingActions).toHaveLength(1);
    action.trigger('click');
    // comfimation modal should be opned with action texts
    expect(vm.showConfirmModal).toBe(true);
    expect(vm.confirmTitle).toEqual(testAction.confirm.title);
    expect(vm.confirmMessage).toEqual(testAction.confirm.message);
    expect(vm.confirmOKMessage).toEqual(testAction.confirm.okMessage);
    expect(vm.confirmKOMessage).toEqual(testAction.confirm.koMessage);
    // click on confirm button
    okButton.trigger('click');
    expect(confirmMock).toBeCalled();
  });

  it('Room detail contain action menu only for rooms and spaces', () => {
    // action menu should be displayed for rooms
    expect(roomDetail.contains('.room-settings-dropdown')).toBe(true);
    // action menu should not be displayed for users
    roomDetail.setProps({ contact: user });
    expect(roomDetail.contains('.room-settings-dropdown')).toBe(false);
    // action menu should be displayed for spaces
    roomDetail.setProps({ contact: space });
    expect(roomDetail.contains('.room-settings-dropdown')).toBe(true);
  });
  
});
