import Caver from "caver-js";
import {
  Spinner
} from "spin.js";

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL);
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS); //BApp내에서 사용할 수 있는 저력 상수, 
//컨트랙 배포이후 deployedABI, deployedAddress에 저장해둔 정보를
//읽어서 전역 상수로 설정해둔다.(Webpack에서)

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



  /////////// UI 변경 관련 ////////////
  //로그인 상태 UI 변경
  changeUI: async function (walletInstance) {
    $('#login').hide(); //로그인 버튼 숨기고

    $('#user').show(); //유저 버튼 공개
    $('#logout').show(); //로그아웃 버튼 공개
    $('#navbarDropdown').show(); //내 스터디 목록 공개

    this.setUserStudyList(); //nav바의 참여 스터디 목록 추가

    //그룹 리스트 추가
    this.setGroupInfo(); //그룹 정보 업데이트
    this.setGroupNotice(); //게시글 업데이트
    this.setRangking(); //랭킹 추가 

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
  //그룹 정보 업데이트
  setGroupInfo: async function(){
    var groupid = this.getGroupId();
    var recvData = await this.getGroupInfo(groupid);

    //각 정보 위치에 등록
    $('#groupName').append(recvData.studyName); //그룹 이름
    $('#groupGoal').append(recvData.studyGoal); //그룹 목표
    $('#groupInfo').append(recvData.studyIntro); //그룹 정보
  },
  //게시글 위치에 등록
  setGroupNotice: async function(){
    var groupid = this.getGroupId();
    var recvData = await this.getGroupNotice(groupid);
    
    for (var k in recvData)
    {
      $('#groupNoticeList').append(
        '<li>\
        <div class="row text">\
          <div class="col-sm">' + recvData[k].noticeTitle + '</div>\
            <div class="col-sm">\
              <button class="btn btn-outline-success disabled" type="submit" data-toggle="modal" data-target="#notice" onclick=App.viewNotice(' + recvData[k].id + ')>보기</button>\
            </div>\
          </div>\
        </li>'
      );
    }
  },
  //게시글 작성
  setNotice: async function(title, text){
    $('#noticeTitle').empty();
    $('#noticeText').empty();

    $('#noticeTitle').append("제목 : " + title);
    $('#noticeText').append(text);
  },
  //게시글 랭킹 표시
  setRangking: async function(title, text){
    var recvArray = await this.getRangking();
    console.log(recvArray);
    for( var k in recvArray)
    {
     $('#rangking').append('<li>' + recvArray[k][3] + '</li>');
    }


    // for
    // $('rangking').append(
    //   "<li>"+랭킹+"</li>"
    // )
  },

  ////////////UI 변경 관련 끝//////////////
  





  ////////////동작 관련//////////////
  //groupID가져오기
  getGroupId: function(){
    return sessionStorage.getItem('groupId');
  },
  //스터디 그룹용 페이지로 이동(상단바에서 사용 )
  moveGroupPage: function(id) {
    sessionStorage.setItem('groupId', id);
    location.href="/studyGroup.html";
  },
  //게시글 작성 동작 
  writePosts: async function(){
    var title = $('#postsTitle').val();
    var main = $('#postsMain').val();
    await this.sendNotice(title, main);
    location.reload();
  },
  //게시물 내용 띄우기
  viewNotice : async function(noticeId) {
    var recvData = await this.getNotice(noticeId);
    console.log(recvData);
    this.setNotice(recvData.noticeTitle, recvData.noticeText);
    sessionStorage.setItem("current", noticeId);
  },
  //로그 전송 동작
  sendLog : async function() {
    var noticeId = sessionStorage.getItem('current');
    var address = this.getWallet().address;
    var score = $("input[name='scoreRadio']:checked").val();
    if(!score)
      score=0;

    var recvData = await this.sendNoticeLog(noticeId, address, score);
    console.log(recvData.data);
    location.reload();


  },
  getGroupStudyData: function(_index){
    return agContract.methods.getStudyDate(_index).call();
  },
  
  ////////////동작 관련 끝//////////////




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

  //그룹 스터디 정보 JSON반환
  getGroupInfo: async function (groupid) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getGroupInfo';
    var sendArray = {};
    sendArray['groupid'] = groupid;
    var sendData = JSON.stringify(sendArray);

    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });

    return recvData[0];
  },

  //임시 그룹에 속해 있는 학생들 JSON 반환
  getTempGroupStudentList: async function (id){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getTempGroupStudentList';
    var sendArray = {};
    sendArray['groupid'] = id;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  
  //게시물 데이터 DB에 냄
  sendNotice: async function (title, main){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'sendNotice';
    var sendArray = {};
    sendArray['address'] = this.getWallet().address;
    sendArray['groupid'] = this.getGroupId();
    sendArray['title'] = title;
    sendArray['main'] = main;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  //게시글 보여주기 위해 JSON반환
  getGroupNotice: async function(groupid){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getGroupNotice';
    var sendArray = {};
    sendArray['groupid'] = groupid;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  //게시글 내용 JSON반환
  getNotice: async function(id){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getNotice';
    var sendArray = {};
    sendArray['id'] = id;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData[0];
  },  
  //로그 서버에 전송
  sendNoticeLog: async function(noticeId, address, score){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'sendNoticeLog';
    var sendArray = {};
    sendArray['noticeId'] = noticeId;
    sendArray['address'] = address;
    sendArray['score'] = score;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  

  //랭킹 가져오기
  getRangking: async function(){
    var recvData = await this.getContractId();
    var contractIndex = recvData.contractIndex;

    //그룹 소속 주소 호출
    var recvArray = await this.getGroupStudyData(contractIndex);
    // console.log(recvArray);

    //주소들의 평점 합
    var recvArray2 = await this.getGroupAllUserTotalScore(this.getGroupId(), recvArray);
    await console.log(recvArray2);
    recvArray2.sort(function(a,b)
    {
        return (a[1] - b[1]);
    });
    console.log(recvArray2);

    return recvArray2;
    
    // console.log(recvArray);


    // var url = 'http://mijuhome.iptime.org:5333/';
    // var methods = 'getNotice';
    // var sendArray = {};
    // sendArray['id'] = id;
    // var sendData = JSON.stringify(sendArray);
    // var recvData;
    // await $.post(url + methods, {'data' : sendData }, function(data){
    //   recvData = JSON.parse(data);
    // });
    // return recvData[0];
  }, 
  //컨트랙 id부르기
  getContractId: async function(){
    var groupid = this.getGroupId();

    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getContractId';
    var sendArray = {};
    sendArray['groupid'] = groupid;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    
    return recvData[0];
  },
 ////////////데이터 관련 끝//////////////////////////////////////////

  //평점 합 부르기
  getGroupAllUserTotalScore: async function(groupid, addressArray){
    // console.log(addressArray);

    var array = new Array();
    for( var k in addressArray)
    {
      var url = 'http://mijuhome.iptime.org:5333/';
      var methods = 'getGroupUserTotalScore';
      var sendArray = {};
      sendArray['groupid'] = groupid;
      sendArray['address'] = addressArray[k];
      var sendData = JSON.stringify(sendArray);
      var recvData;
      await $.post(url + methods, {'data' : sendData }, function(data){
        recvData = JSON.parse(data);
      });
      var num = recvData[0]['SUM(noticeScore)'];
      if(!num)
        num = 0;
        
      var name = await this.getName(addressArray[k]);
      console.log(name);
          
      array.push([k, addressArray[k], num, name.userName]); 
    } 
    return array;
  },
  getName: async function(address){
    // console.log(addressArray);


    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getName';
    var sendArray = {};
    sendArray['address'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    
    return recvData[0];
  },
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