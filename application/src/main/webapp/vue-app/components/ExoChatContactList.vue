<template>
  <div class="contactListContainer">
    <div v-if="ap">
      <div v-show="mq !== 'mobile' || contactSearchMobile" class="contactFilter">
        <i v-if="mq !== 'mobile'" class="uiIconSearchLight"></i>
        <input ref="contactSearch" v-model="searchTerm" :placeholder="$t('exoplatform.chat.contact.search.placeholder')" type="text" @keyup.esc="closeContactSearch" >
        <div v-show="searchTerm !== ''" class="contact-search-close" @click="closeContactSearch"><i class="uiIconClose"></i></div>
      </div>
      <div class="listHeader">
        <div v-if="mq === 'mobile'" class="hamburger-menu" @click="$emit('open-side-menu')"><i class="uiIconMenu"></i></div>
        <exo-dropdown-select v-if="mq !== 'mobile'">
          <span slot="toggle">{{ sortByDate[sortFilter] }}</span>
          <i slot="toggle" class="uiIconArrowDownMini"></i>
          <div slot="menu" class="dropdown-category">{{ $t('exoplatform.chat.contact.filter.sort') }}</div>
          <li v-for="(label, filter) in sortByDate" slot="menu" :key="filter" @click="selectSortFilter(filter)"><a href="#"><i :class="{'not-filter': sortFilter !== filter}" class="uiIconTick"></i>{{ label }}</a></li>
          <div slot="menu" class="dropdown-category">{{ $t('exoplatform.chat.contact.filter.actions') }}</div>
          <li slot="menu" @click="markAllAsRead"><a href="#"><i class="uiIconTick not-filter"></i>{{ $t('exoplatform.chat.contact.mark.read') }}</a></li>
        </exo-dropdown-select>
        <exo-dropdown-select v-if="mq !== 'mobile'">
          <span slot="toggle">{{ filterByType[typeFilter] }}</span>
          <i slot="toggle" class="uiIconArrowDownMini"></i>
          <li v-for="(label, filter) in filterByType" slot="menu" :key="filter" @click="selectTypeFilter(filter)"><a href="#"><i :class="{'not-filter': typeFilter !== filter}" class="uiIconTick"></i>{{ label }}</a></li>
        </exo-dropdown-select>
        <div class="room-actions">
          <div v-if="mq === 'mobile'" class="filter-action" @click="filterMenuClosed = false">
            <i class="uiIconFilter"></i>
          </div>
          <div v-exo-tooltip.top="$t('exoplatform.chat.create.team')" class="add-room-action" @click="openCreateRoomModal">
            <i class="uiIconSimplePlus"></i>
          </div>
          <div v-if="mq === 'mobile'" @click="selectContactSearch">
            <i class="uiIconSearch"></i>
          </div>
        </div>
      </div>
    </div>
    <div id="chat-users" class="contactList isList">
      <transition-group name="chat-contact-list">
        <div v-hold-tap="openContactActions" v-for="contact in filteredContacts" :key="contact.user" :title="contactTooltip(contact)" :class="{selected: mq !== 'mobile' && selected && contact && selected.user === contact.user, currentContactMenu: mq === 'mobile' && contactMenu && contactMenu.user === contact.user, hasUnreadMessages: contact.unreadTotal > 0, 'has-not-sent-messages' : contact.hasNotSentMessages}" class="contact-list-item contact-list-room-item" @click="selectContact(contact)">
          <exo-chat-contact :is-enabled="contact.isEnabledUser === 'true' || contact.isEnabledUser === 'null'" :list="true" :type="contact.type" :user-name="contact.user" :pretty-name="contact.prettyName" :name="contact.fullName" :status="contact.status" :last-message="getLastMessage(contact.lastMessage, contact.type)">
            <div v-if="mq === 'mobile'" :class="{'is-fav': contact.isFavorite}" class="uiIcon favorite"></div>
            <div v-if="mq === 'mobile' || drawerStatus" :class="[drawerStatus ? 'last-message-time-drawer last-message-time' : 'last-message-time']" >{{ getLastMessageTime(contact) }}</div>
          </exo-chat-contact>
          <div v-if="contact.unreadTotal > 0" class="unreadMessages">{{ contact.unreadTotal }}</div>
          <i v-exo-tooltip.top.body="$t('exoplatform.chat.msg.notDelivered')" v-if="!drawerStatus" class="uiIconNotification"></i>
          <div v-exo-tooltip.top.body="favoriteTooltip(contact)" v-if="mq !== 'mobile'" :class="{'is-fav': contact.isFavorite}" class="uiIcon favorite" @click.stop="toggleFavorite(contact)"></div>
        </div>
      </transition-group>
      <div v-show="loadingContacts" class="contact-list-item isList">
        <div class="seeMoreContacts">
          {{ $t('exoplatform.chat.loading') }}
        </div>
      </div>
      <div v-show="hasMoreContacts" class="contact-list-item isList" @click="loadMore()">
        <div class="seeMoreContacts">
          <a href="#"><u>{{ $t('exoplatform.chat.seeMore') }}</u></a>
          <i class="uiIconArrowDownMini"></i>
        </div>
      </div>
      <div v-if="mq == 'mobile' && contactMenu !== null" v-show="!contactMenuClosed" class="uiPopupWrapper chat-modal-mask" @click.prevent.stop="closeContactActions">
        <ul class="mobile-options">
          <li><a href="#" @click.prevent="toggleFavorite(contactMenu)">{{ contactMenu.isFavorite === false ? $t('exoplatform.chat.add.favorites') : $t('exoplatform.chat.remove.favorites') }}</a></li>
          <li v-show="contactMenu.type != 't'" @click.stop><a :href="getProfileLink()">{{ $t('exoplatform.chat.contact.profile') }}</a></li>
        </ul>
      </div>
      <div v-if="mq == 'mobile'" v-show="!filterMenuClosed" class="uiPopupWrapper chat-modal-mask">
        <ul class="mobile-options filter-options">
          <li class="options-category">
            <i class="uiIconClose" @click="cancelFilterMobile"></i>
            <span><i class="uiIconFilter"></i>{{ $t('exoplatform.chat.contact.filter') }}</span>
            <div @click="saveFilterMobile">{{ $t('exoplatform.chat.contact.filter.save') }}</div>
          </li>
          <li class="options-category">{{ $t('exoplatform.chat.contact.filter.sort') }}</li>
          <li v-for="(label, filter) in sortByDate" slot="menu" :key="filter" @click="sortFilterMobile = filter"><a href="#"><i :class="{'not-filter': sortFilterMobile !== filter}" class="uiIconTick"></i>{{ label }}</a></li>
          <li class="options-category">{{ $t('exoplatform.chat.contact.filter.by') }}</li>
          <li v-for="(label, filter) in filterByType" :key="filter" @click="typeFilterMobile = filter"><a href="#"><i :class="{'not-filter': typeFilterMobile !== filter}" class="uiIconTick"></i>{{ label }}</a></li>
          <li @click="allAsReadFilterMobile = !allAsReadFilterMobile"><a href="#"><i :class="{'not-filter': !allAsReadFilterMobile}" class="uiIconTick"></i>{{ $t('exoplatform.chat.contact.mark.read') }}</a></li>
        </ul>
      </div>
    </div>
    <exo-chat-room-form-modal :show="createRoomModal" :selected="newRoom" @room-saved="roomSaved" @modal-closed="closeModal"></exo-chat-room-form-modal>
  </div>
</template>

<script>
import * as chatServices from '../chatServices';
import * as chatWebStorage from '../chatWebStorage';
import * as chatWebSocket from '../chatWebSocket';
import * as chatTime from '../chatTime';
import {chatConstants} from '../chatConstants';

import {composerApplications} from '../extension';

export default {
  props: {
    /**
     * List of contacts objects to display in List.
     * Contact {
     *   fullName: {string} full name of contact
     *   isActive: {string} if the contact is of type user, this will be equals to "true" when the user is enabled
     *   isFavorite: {Boolean} whether is favortie of current user or not
     *   lastMessage: {string} Last message object with current user
     *   room: {string} contact room id
     *   status: {string} if the contact is of type user, this variable determines the user status (away, offline, available...)
     *   timestamp: {number} contact update timestamp
     *   type: {string} contact type, 'u' for user, 't' for team and 's' for space
     *   unreadTotal: {number} unread total number of messages for this contact
     *   user: {string} contact id, if user , username else team-{CONTACT_ID} or space-{CONTACT_ID}
     * }
     */
    drawerStatus: {
      type: Boolean,
      default: false
    },
    contacts: {
      type: Array,
      default: function() { return [];}
    },
    contactsLoaded: {
      type: Boolean,
      default: function() { return false;}
    },
    /**
     * whether some contacts are currently loading or not
     */
    loadingContacts: {
      type: Boolean,
      default: function() { return false;}
    },
    /**
    * Select contact object
    * Contact {
      *   fullName: {string} full name of contact
      *   isActive: {string} if the contact is of type user, this will be equals to "true" when the user is enabled
      *   isFavorite: {Boolean} whether is favortie of current user or not
      *   lastMessage: {string} Last message object with current user
      *   room: {string} contact room id
      *   status: {string} if the contact is of type user, this variable determines the user status (away, offline, available...)
      *   timestamp: {number} contact update timestamp
      *   type: {string} contact type, 'u' for user, 't' for team and 's' for space
      *   unreadTotal: {number} unread total number of messages for this contact
      *   user: {string} contact id, if user , username else team-{CONTACT_ID} or space-{CONTACT_ID}
      * }
    **/
    selected: {
      type: Object,
      default: function() {
        return {};
      }
    },
    searchWord:{
      type: String,
      default: ''
    }
  },
  data : function() {
    return {
      sortByDate: {
        'Recent': this.$t('exoplatform.chat.contact.recent'),
        'Unread': this.$t('exoplatform.chat.contact.unread'),
      },
      sortFilter: chatConstants.SORT_FILTER_DEFAULT,
      sortFilterMobile: null,
      filterByType: {
        'All': this.$t('exoplatform.chat.contact.all'),
        'People': this.$t('exoplatform.chat.people'),
        'Rooms': this.$t('exoplatform.chat.teams'),
        'Spaces': this.$t('exoplatform.chat.spaces'),
        'Favorites': this.$t('exoplatform.chat.favorites')
      },
      typeFilter: chatConstants.TYPE_FILTER_DEFAULT,
      typeFilterMobile: null,
      allAsReadFilterMobile: false,
      contactSearchMobile: false,
      createRoomModal: false,
      searchTerm: '',
      newRoom: {
        name: '',
        participants: []
      },
      totalEntriesToLoad: chatConstants.CONTACTS_PER_PAGE,
      contactMenu: null,
      contactMenuClosed: true,
      filterMenuClosed: true,
      inactive: this.$t('exoplatform.chat.inactive')
    };
  },
  computed: {
    statusStyle() {
      return this.contactStatus === 'inline' ? 'user-available' : 'user-invisible';
    },
    usersCount() {
      return this.contacts.filter(contact => contact.type === 'u').length;
    },
    roomsCount() {
      return this.contacts.filter(contact => contact.type === 't').length;
    },
    spacesCount() {
      return this.contacts.filter(contact => contact.type === 's').length;
    },
    favoritesCount() {
      return this.contacts.filter(contact => contact.isFavorite).length;
    },
    filteredContacts: function() {
      let sortedContacts = this.contacts.slice(0).filter(contact => (contact.room || contact.user) && contact.fullName);
      // this code used to search in whole Chat app, because the search uses a criteria (typeFilter)
      if(this.typeFilter !== 'All' && !this.drawerStatus) {
        sortedContacts = sortedContacts.filter(contact =>
          this.typeFilter === 'People' && contact.type === 'u'
          || this.typeFilter === 'Rooms' && contact.type === 't'
          || this.typeFilter === 'Spaces' && contact.type === 's'
          || this.typeFilter === 'Favorites' && contact.isFavorite
        );
      }
      if (this.searchTerm && this.searchTerm.trim().length) {
        sortedContacts = sortedContacts.filter(contact => this.normalizeText(contact.fullName.toLowerCase()).indexOf(this.normalizeText(this.searchTerm.toLowerCase())) >= 0);
      }
      // for the drawer chat, the search doesn't use a criteria (search filter) so it searches in all contacts
      if (this.searchWord && this.searchWord.trim().length) {
        sortedContacts = sortedContacts.filter(contact => this.normalizeText(contact.fullName.toLowerCase()).indexOf(this.normalizeText(this.searchWord.toLowerCase())) >= 0);
      }
      if (this.sortFilter === 'Unread') {
        sortedContacts.sort(function(a, b){
          const unreadTotal = b.unreadTotal - a.unreadTotal;
          if (unreadTotal === 0) {
            return b.timestamp - a.timestamp;
          }
          return unreadTotal;
        });
      } else {
        sortedContacts.sort(function(a, b){
          return b.timestamp - a.timestamp;
        });
      }
      return sortedContacts.slice(0, this.totalEntriesToLoad);
    },
    hasMoreContacts() {
      if(this.searchTerm.trim().length) {
        return false;
      }
      // All Rooms and spaces are loaded with the first call, only users are paginated
      switch (this.typeFilter) {
      case 'People':
        return this.usersCount >= this.totalEntriesToLoad;
      case 'Rooms':
        return this.roomsCount > this.totalEntriesToLoad;
      case 'Spaces':
        return this.spacesCount > this.totalEntriesToLoad;
      case 'Favorites':
        return this.favoritesCount > this.totalEntriesToLoad;
      default:
        return this.contacts.length > this.totalEntriesToLoad || this.usersCount >= this.totalEntriesToLoad;
      }
    }
  },
  watch: {
    searchTerm(value) {
      this.$emit('search-contact', value);
    }
  },
  created() {
    document.addEventListener(chatConstants.EVENT_ROOM_MEMBER_LEFT, this.leftRoom);
    document.addEventListener(chatConstants.EVENT_ROOM_DELETED, this.leftRoom);
    document.addEventListener(chatConstants.EVENT_ROOM_MEMBER_JOINED, this.joinedToNewRoom);
    document.addEventListener(chatConstants.EVENT_ROOM_FAVORITE_ADDED, this.favoriteAdded);
    document.addEventListener(chatConstants.EVENT_ROOM_FAVORITE_REMOVED, this.favoriteRemoved);
    document.addEventListener(chatConstants.EVENT_MESSAGE_RECEIVED, this.messageReceived);
    document.addEventListener(chatConstants.EVENT_MESSAGE_SENT, this.messageSent);
    document.addEventListener(chatConstants.EVENT_USER_STATUS_CHANGED, this.contactStatusChanged);
    document.addEventListener(chatConstants.EVENT_MESSAGE_READ, this.markRoomMessagesRead);
    document.addEventListener(chatConstants.ACTION_ROOM_EDIT, this.editRoom);
    document.addEventListener(chatConstants.ACTION_ROOM_LEAVE, this.leaveRoom);
    document.addEventListener(chatConstants.ACTION_ROOM_DELETE, this.deleteRoom);
    document.addEventListener(chatConstants.ACTION_ROOM_SELECT, this.selectContact);
    document.addEventListener(chatConstants.EVENT_ROOM_SELECTION_CHANGED, this.contactChanged);
    document.addEventListener(chatConstants.EVENT_MESSAGE_NOT_SENT, this.messageNotSent);
    this.typeFilter = chatWebStorage.getStoredParam(chatConstants.STORED_PARAM_TYPE_FILTER, chatConstants.TYPE_FILTER_DEFAULT);
    this.sortFilter = chatWebStorage.getStoredParam(chatConstants.STORED_PARAM_SORT_FILTER, chatConstants.SORT_FILTER_DEFAULT);
    this.initFilterMobile();

  },
  destroyed() {
    document.removeEventListener(chatConstants.EVENT_ROOM_MEMBER_LEFT, this.leftRoom);
    document.removeEventListener(chatConstants.EVENT_ROOM_DELETED, this.leftRoom);
    document.removeEventListener(chatConstants.EVENT_ROOM_MEMBER_JOINED, this.joinedToNewRoom);
    document.removeEventListener(chatConstants.EVENT_ROOM_FAVORITE_ADDED, this.favoriteAdded);
    document.removeEventListener(chatConstants.EVENT_ROOM_FAVORITE_REMOVED, this.favoriteRemoved);
    document.removeEventListener(chatConstants.EVENT_MESSAGE_RECEIVED, this.messageReceived);
    document.addEventListener(chatConstants.EVENT_MESSAGE_SENT, this.messageSent);
    document.removeEventListener(chatConstants.EVENT_USER_STATUS_CHANGED, this.contactStatusChanged);
    document.removeEventListener(chatConstants.EVENT_MESSAGE_READ, this.markRoomMessagesRead);
    document.removeEventListener(chatConstants.ACTION_ROOM_EDIT, this.editRoom);
    document.removeEventListener(chatConstants.ACTION_ROOM_LEAVE, this.leaveRoom);
    document.removeEventListener(chatConstants.ACTION_ROOM_DELETE, this.deleteRoom);
    document.removeEventListener(chatConstants.ACTION_ROOM_SELECT, this.selectContact);
    document.removeEventListener(chatConstants.EVENT_ROOM_SELECTION_CHANGED, this.contactChanged);
    document.removeEventListener(chatConstants.EVENT_MESSAGE_NOT_SENT, this.messageNotSent);
  },
  methods: {

    normalizeText(s) {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    selectContact(contact) {
      if(!contact) {
        contact = {};
      }
      if(contact.detail) {
        contact = contact.detail;
      }
      if(!contact && !contact.room && contact.user) {
        contact = contact.user;
      }
      if(contact.type && contact.type === 'u' && contact.isEnabledUser === 'null') {
        chatServices.getUserState(contact.user).then(userState => {
          chatServices.updateUser(eXo.chat.userSettings, contact.user, userState.isDeleted, userState.isEnabled);
          this.selected.isEnabledUser = !userState.isDeleted && userState.isEnabled ? 'true' : 'false';
          contact.isEnabledUser = this.selected.isEnabledUser;
        });
      }
      eXo.chat.selectedContact = contact;
      this.contactChanged(contact);
      this.$emit('contact-selected', contact);
    },
    contactChanged(e) {
      const selectedContact = e;
      if (selectedContact && selectedContact.room) {
        chatWebSocket.setRoomMessagesAsRead(selectedContact.room);
      }
    },
    markAllAsRead() {
      chatWebSocket.setRoomMessagesAsRead();
    },
    toggleFavorite(contact) {
      chatServices.toggleFavorite(contact.room, contact.user, !contact.isFavorite).then(contact.isFavorite = !contact.isFavorite);
    },
    selectSortFilter(filter) {
      this.sortFilter = filter;
      chatWebStorage.setStoredParam(chatConstants.STORED_PARAM_SORT_FILTER, this.sortFilter);
    },
    selectTypeFilter(filter) {
      this.typeFilter = filter;
      chatWebStorage.setStoredParam(chatConstants.STORED_PARAM_TYPE_FILTER, this.typeFilter);
    },
    initFilterMobile() {
      this.typeFilterMobile = this.typeFilter;
      this.sortFilterMobile = this.sortFilter;
    },
    saveFilterMobile() {
      this.filterMenuClosed = true;
      this.selectTypeFilter(this.typeFilterMobile);
      this.selectSortFilter(this.sortFilterMobile);
      if (this.allAsReadFilterMobile) {
        this.markAllAsRead();
      }
      this.allAsReadFilterMobile = false;
    },
    cancelFilterMobile() {
      this.filterMenuClosed = true;
      this.allAsReadFilterMobile = false;
      this.initFilterMobile();
    },
    selectContactSearch() {
      this.contactSearchMobile = true;
      this.$nextTick(() => this.$refs.contactSearch.focus());
    },
    closeContactSearch() {
      this.contactSearchMobile = false;
      this.searchTerm = '';
    },
    openCreateRoomModal() {
      this.newRoom = {};
      this.createRoomModal = true;
    },
    messageNotSent(e) {
      const foundContact = this.findContact(e.detail.room);
      if (foundContact) {
        foundContact.hasNotSentMessages = true;
        this.$forceUpdate();
      }
    },
    messageReceived(event) {
      const message = event.detail;
      const room = message.room;

      if(!room) {
        return;
      }

      const foundContact = this.findContactByRoomOrUser(room, message.data ? message.data.user : message.sender);

      if(foundContact) {
        if (!foundContact.lastMessage) {
          foundContact.lastMessage = {};
        }
        foundContact.lastMessage = message.data;
        foundContact.timestamp = message.ts;
        if (this.selected){
          if (this.selected.room !== foundContact.room || this.mq === 'mobile') {
            foundContact.unreadTotal ++;
          }
        }else {
          foundContact.unreadTotal ++;
        }
      } else {
        chatServices.getRoomDetail(eXo.chat.userSettings, room).then((contact) => {
          if(contact && contact.user && contact.user.length && contact.user !== 'undefined') {
            contact.unreadTotal = 1;
            this.contacts.unshift(contact);
          }
        });
      }
    },
    messageSent(event) {
      const message = event.detail;
      const foundContact = this.findContactByRoomOrUser(message.room, message.data ? message.data.user : message.sender);
      if(foundContact) {
        if (!foundContact.lastMessage) {
          foundContact.lastMessage = {};
        }
        foundContact.lastMessage = message.data;
        foundContact.timestamp = message.data.timestamp;
      }
    },
    roomSaved(room) {
      this.createRoomModal = false;
      this.selectContact(room);
    },
    editRoom() {
      chatServices.getRoomParticipants(eXo.chat.userSettings, this.selected).then(data => {
        this.selected.participants = data.users;
        this.newRoom = JSON.parse(JSON.stringify(this.selected));
        this.createRoomModal = true;
      });
    },
    leaveRoom() {
      if(this.selected && this.selected.type === 't') {
        chatWebSocket.leaveRoom(this.selected.room);
      }
    },
    deleteRoom() {
      if(this.selected && this.selected.type === 't') {
        chatWebSocket.deleteRoom(this.selected.room);
      }
    },
    closeModal() {
      this.createRoomModal = false;
      this.newRoom = {};
    },
    markRoomMessagesRead(e) {
      const message = e.detail;
      if (message && message.room) {
        const contactToUpdate = this.findContact(message.room);
        if(contactToUpdate) {
          contactToUpdate.unreadTotal = 0;
          contactToUpdate.hasNotSentMessages = false;
        }
      } else {
        this.contacts.forEach(contact => {
          contact.unreadTotal = 0;
        });
        this.$emit('refresh-contacts', true);
        this.$forceUpdate();
      }
    },
    leftRoom(e) {
      const message = e.detail ? e.detail: e;
      const sender = message.data && message.data.sender ? message.data.sender : message.sender;
      if(message.event === 'room-member-left' && sender !== eXo.chat.userSettings.username) {
        return;
      }
      const roomLeft = message.data && message.data.room ? message.data.room : message.room;
      const roomIndex = this.contacts.findIndex(contact => contact.room === roomLeft);
      if (roomIndex >= 0) {
        this.contacts.splice(roomIndex, 1);
        if(this.selected && this.selected.room === roomLeft) {
          if(!this.contacts || this.contacts.length === 0) {
            this.selectContact();
          } else {
            if(this.filteredContacts && this.filteredContacts.length) {
              this.selectContact(this.filteredContacts[0]);
            } else {
              this.selectContact();
            }
          }
        }
      }
    },
    joinedToNewRoom(e) {
      if (!this.findContact(e.detail.room)) {
        this.contacts.push(e.detail.data);
      }
    },
    favoriteAdded(event) {
      const room = event.room ? event.room : event.detail && event.detail.room ? event.detail.room : null;
      const contactToUpdate = this.findContact(room);
      if(contactToUpdate) {
        contactToUpdate.isFavorite = true;
      }
    },
    favoriteRemoved(event) {
      const room = event.room ? event.room : event.detail && event.detail.room ? event.detail.room : null;
      const contactToUpdate = this.findContact(room);
      if(contactToUpdate) {
        contactToUpdate.isFavorite = false;
      }
    },
    findContact(value, field) {
      if (!field)  {
        field = 'room';
      }
      const RoomId = new URL(location.href).searchParams.get('roomId');
      if (RoomId) {
        window.history.replaceState(null, null, window.location.pathname);
        const contact = this.findContact(RoomId);
        this.selectContact(contact);
      }
      return this.contacts.find(contact => contact[field] === value);
    },
    findContactByRoomOrUser(room, targetUser) {
      let foundContact = null;
      if (room && room.trim().length)  {
        foundContact = this.findContact(room, 'room');
      }
      if (!foundContact && targetUser && targetUser.trim().length) {
        foundContact = this.findContact(targetUser, 'user');
      }
      return foundContact;
    },
    loadMore() {
      this.totalEntriesToLoad += chatConstants.CONTACTS_PER_PAGE;
      this.$emit('load-more-contacts', this.totalEntriesToLoad);
    },
    favoriteTooltip(contact) {
      return contact.isFavorite === true ? this.$t('exoplatform.chat.remove.favorites') : this.$t('exoplatform.chat.add.favorites');
    },
    contactTooltip(contact) {
      return contact.isEnabledUser === 'true' || contact.isEnabledUser === 'null' ? contact.fullName : contact.fullName.concat(' ').concat('(').concat(this.inactive).concat(')');
    },
    getLastMessage(message, contactType) {
      if (message) {
        if (!message.isSystem) {
          const filteredMessage = this.filterLastMessage(message.msg);
          return contactType === 'u' ? message.msg : `${message.fullname}: ${filteredMessage}`;
        } else {
          let systemMsg = '';
          composerApplications.forEach(element => {
            if (message.options.type === element.type) {
              systemMsg = `<span><i class="${element.iconClass || ''}"></i>${this.$t(element.nameKey || element.labelKey || '')}</span>`;
            }
          });
          return systemMsg;
        }
      }
      return '';
    },
    getLastMessageTime(contact) {
      const timestamp = contact.lastMessage && contact.lastMessage.timestamp ? contact.lastMessage.timestamp : contact.timestamp;
      if (timestamp) {
        if (chatTime.isSameDay(timestamp, new Date().getTime())) {
          return chatTime.getTimeString(timestamp);
        } else if (timestamp === -1){
          return '';
        } else {
          return chatTime.getDayDateString(timestamp);
        }
      }
      return '';
    },
    filterLastMessage(msg) {
      if (msg === chatConstants.DELETED_MESSAGE) {
        return this.$t('exoplatform.chat.deleted');
      }
      // replace line breaks with an ellipsis
      if (msg.indexOf('<br/>') >= 0) {
        return msg.replace(msg.slice(msg.indexOf('<br/>')),'...');
      }
      return msg;
    },
    contactStatusChanged(e) {
      const contactChanged = e.detail;

      if (contactChanged.data && contactChanged.data.status && contactChanged.sender && contactChanged.sender.trim().length && eXo.chat.userSettings.username !== contactChanged.sender) {
        const foundContact = this.findContactByRoomOrUser(null, contactChanged.sender);
        if (foundContact) {
          foundContact.status = contactChanged.data.status;
        }
      }
    },
    openContactActions(user) {
      const contact = this.contacts.find(contact => contact['user'] === user);
      this.contactMenuClosed = false;
      this.contactMenu = contact;
    },
    closeContactActions() {
      this.contactMenuClosed = true;
      this.contactMenu = null;
    },
    getProfileLink() {
      if (this.contactMenu.type === 'u') {
        return chatServices.getUserProfileLink(this.contactMenu.user);
      } else if (this.contactMenu.type === 's') {
        return chatServices.getSpaceProfileLink(this.contactMenu.fullName);
      }
      return '#';
    },
  }
};
</script>
