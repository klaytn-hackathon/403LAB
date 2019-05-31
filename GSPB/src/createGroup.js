import Caver from "caver-js";
import {
  Spinner
} from "spin.js";

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS); //BApp내에서 사용할 수 있는 전역 상수, 

const App = {

  auth: {
    accessType: 'keystore', //인증 방식중 키스토어&비번 방식
    keystore: '', //키스토어 파일 전체 내용
    password: '' // 키스토어 비번 
  },

  ////////////// 기타 //////////////
  //페이지 로드 시 작동  
  start: async function () {    
    //start함수 : 세션을 통해 인증 받은 적 있는지 체크
    const walletFromSession = sessionStorage.getItem('walletInstance');
    if (walletFromSession) { //월렛 정보가 있을때 실행
      try {
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession)); //cav에 저장된 지갑 정보 추가
        this.changeUI(JSON.parse(walletFromSession)); //로그인 된 UI로 변경
        
      } catch (e) { //세션에 있는 인스턴스가 유효한 지갑 정보가 아닐경우
        sessionStorage.removeItem('walletInstance'); //세션 값 삭제
        location.href="/";
      }
    }
    else
      location.href="/";
  },
  //계정 지갑 인스턴스 반환 //cav.js에 등록된 계정이 있으면 가져온다.
  getWallet: function () {
    if (cav.klay.accounts.wallet.length) { //로그인 된 계정이 있다면
      return cav.klay.accounts.wallet[0]; //계정의 첫번째값 로그인된 계정을 불러온다.
    }
  },
  //스피너 보여주기
  showSpinner: function () {
    var tartget = document.getElementById("spin");
    return new Spinner(opts).spin(tartget); //스피너 인스턴스 가져와 리턴
  },
  //////////////////////////////////



 /////////// UI 변경 관련 //////////// 
  //로그인 상태 UI 변경
  changeUI: async function (walletInstance) {
    $('#login').hide(); //로그인 버튼 숨기고

    $('#user').show(); //유저 버튼 공개
    $('#logout').show(); //로그아웃 버튼 공개
    $('#navbarDropdown').show(); //내 스터디 목록 공개

    this.setUserStudyList(); //nav바의 참여 스터디 목록 추가
  },
  //상단바 스터디 목록 추가 // (완료)
  setUserStudyList: async function(){
    const address = this.getWallet().address;
    var userConfirmGroupList = await this.getUserConfirmGroupList(address);
    for ( var k in userConfirmGroupList)
    {
      $('#nav-study-list')
          .append(
            '<button class="dropdown-item" onclick="App.moveGroupPage('+userConfirmGroupList[k].id+')">'
            + userConfirmGroupList[k].studyName +
            '</button>'
          );
    }
  },
 /////////// UI 변경 끝 ////////////



   ////////////동작 관련//////////////////////////////////////////
  //모집 공고 등록 버튼
  createTempGroup: async function () {
    var sendArray = {};
    sendArray['studyName'] = $('#studyName').val();
    sendArray['studyGoal'] = $('#studyGoal').val();
    sendArray['studyIntro'] = $('#studyIntro').val();
    sendArray['studySt'] = $('#datepicker1').val();
    sendArray['studyEd'] = $('#datepicker2').val();
    sendArray['studentLimit'] = $('#studentLimit').val();
    sendArray['ownerAddress'] = this.getWallet().address;

    var recvData = await this.sendCreateTempGroup(sendArray);
    if(recvData.data)
      alert("임시 스터디 등록 성공, 인원 모집 후 마감해주세요")
    else
      alert("임시 스터디 등록에 실패했습니다.")

    //페이지 새로고침 코드, 처음 UI로 돌아가기 위해 사용
    location.replace("/");
  },
  //스터디 그룹용 페이지로 이동
  moveGroupPage: function(id) {
    sessionStorage.setItem('groupId', id);
    location.href="/studyGroup.html";
  },
  ////////////동작 관련 끝//////////////////////////////////////////



  //////// 로그아웃 관련 ////////
  //로그아웃 버튼 동작
  handleLogout: async function () {
    this.removeWallet(); // 이 함수를 통해 Wallet 인스턴스를 초기화하고 세션 스토리지도 클리어

    //페이지 새로고침 코드, 처음 UI로 돌아가기 위해 사용
    location.reload();
  }, 
  //지갑 정보 삭제 // cav.js, 세션에 저장된 지갑 정보 제거
  removeWallet: function () {
    cav.klay.accounts.wallet.clear(); //cav에 등록되었던 지갑정보 초기화
    sessionStorage.removeItem('walletInstance') //세션의 키값을 이용해서 해당 값 삭제
    this.reset(); // 리셋함수 호출
  }, 
  //auth 변수 초기화
  reset: function () {
    //auth 변수를 초기화 해주면 된다.
    this.auth = {
      keystore: '',
      password: ''
    }; // 엑세스 타입도 초기화 해야하지만, 현재 계속 keystore방식이라 초기화x
  },
  //////////로그아웃 관련 끝////////////////



  ////////////데이터 관련//////////////////////////////////////////

  //사용자의 참여 확정 목록 JSON 반환 (반환값 : id, studyName, studyGoal) // (완성)
  getUserConfirmGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getUserConfirmGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },

  //임시 그룹 가입 요청 보내기 (완성)
  sendCreateTempGroup: async function (_sendArray){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'sendCreateTempGroup';
    var sendArray = _sendArray;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  }  
  ////////////데이터 관련 끝/// /////////////////////////////////////// 
};

window.App = App;

window.addEventListener("load", function () {
  App.start();
});

var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};