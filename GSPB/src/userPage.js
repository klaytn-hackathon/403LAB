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
    this.setUserKlayStatus(); //사용자 Klay 계정 정보 추가

    //그룹 리스트 추가
    this.setUserJoinList();
    this.setUserCreateList();
  },

  //참여 리스트 추가
  setUserJoinList: async function(){
    const address = this.getWallet().address;

    //임시 상태의 가입 리스트 생성
    var tempUserJoinList = await this.getUserTempGroupList(address);
    for(var k in tempUserJoinList) {
      $("#tempJoinGroupList")
      .append('\
          <div class="row">\
          <div class="col-sm"> '+
          tempUserJoinList[k]['studyName']
            + '\
          </div>\
          <div class="col-sm"> '+
            "1klay" //일단 고정
            + '\
          </div>\
          <div class="col-sm">\
            <button class="btn btn-outline-success disabled" type="submit" )>지불대기</button>\
          </div>\
        </div>' 
      );
    }

    //가입 완료 상태의 미지불 리스트 생성
    var holdUserJoinList = await this.getUserHoldGroupList(address);
    
    for(var k in holdUserJoinList) {
      var recvData = await this.getContractId(holdUserJoinList[k]['id']);
      console.log(recvData.contractIndex);
      $("#holdJoinGroupList")
      .append('\
          <div class="row text">\
          <div class="col-sm"> '+
          holdUserJoinList[k]['studyName']
            + '\
          </div>\
          <div class="col-sm"> '+
            "1klay" //일단 고정
            + '\
          </div>\
          <div class="col-sm">\
            <button class="btn btn-outline-success" type="submit" onclick=App.pamentToGroup(' + recvData.contractIndex +"," + holdUserJoinList[k]['id'] + ')>지불</button>\
          </div>\
        </div>' 
      );
    }
    
    //가입 완료 상태의 지불 완료 리스트 생성
    var confirmUserJoinList = await this.getUserConfirmGroupList(address);
    for(var k in confirmUserJoinList) {
      $("#confirmJoinGroupList")
      .append('\
          <div class="row text">\
          <div class="col-sm"> '+
          confirmUserJoinList[k]['studyName']
            + '\
          </div>\
          <div class="col-sm"> '+
            "1klay" //일단 고정
            + '\
          </div>\
          <div class="col-sm">\
            <button class="btn btn-outline-success disabled" type="submit"  )>지불 완료</button>\
          </div>\
        </div>' 
      );
    }

  },

  //생성 리스트 추가
  setUserCreateList: async function(){
    const address = this.getWallet().address;
    var tempCreateList = await this.getCreateTempGroupList(address);
    for(var k in tempCreateList) {

      $("#tempCreateGroupList")
      .append('\
          <div class="row">\
          <div class="col-sm"> '+
          tempCreateList[k]['studyName']
            + '\
          </div>\
          <div class="col-sm"> '+
            "1klay" //일단 고정
            + '\
          </div>\
          <div class="col-sm">\
            <button class="btn btn-outline-success" type="submit" onclick=App.addGroupStudy(' + tempCreateList[k]['id'] + ',' +tempCreateList[k]['studentLimit'] + ')>모집마감</button>\
          </div>\
        </div>' 
      );
    }
    var confirmCreateList = await this.getCreateConfirmGroupList(address);
    for(var k in confirmCreateList) {
      var recvData = await this.getContractId(confirmCreateList[k]['id']);
      $("#holdCreateGroupList")
      .append('\
          <div class="row text">\
          <div class="col-sm"> '+
          confirmCreateList[k]['studyName']
            + '\
          </div>\
          <div class="col-sm"> '+
            "1klay" //일단 고정
            + '\
          </div>\
          <div class="col-sm">\
            <button class="btn btn-outline-success" type="submit" onclick=App.EndGroup(' + recvData.contractIndex +"," + confirmCreateList[k]['id'] + ')>스터디 종료</button>\
          </div>\
        </div>' 
      );
    }
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
  //사용자 Klay 계정 정보 추가
  setUserKlayStatus: async function(){
    var adderss = this.getWallet().address;
    $('#userWallet').append(adderss); //계정 지갑 정보 추가
    $('#userBalance').append(cav.utils.fromPeb(await cav.klay.getBalance(adderss))); //klay잔고
  },
  ////////////UI 변경 관련 끝//////////////

  
  
  
  ////////////동작 관련//////////////

  //스터디 그룹에 클레이 지불 코드
  pamentToGroup: async function (contractid, dbid) {
    console.log(contractid);
    const walletInstance = this.getWallet(); //로그인된 계정 정보 호출
    var spinner = this.showSpinner();
    if (walletInstance) { //지갑 정보 있는 것 확인
      var amount = 1; //현재 1로 고정
      if (amount) { //보낼 값이 있다면
        agContract.methods.depostie(contractid).send({ //컨트렉에 존재하는 deposit()함수에 내용을 보낸다
            //send의 인자로 TX인자를 보내야한다.
            from: walletInstance.address, //누가 함수 호출하는가 //walletInstance.address의 경우 인증 완료된 계정이라 서명 가능(BApp내에서 주소 인증된 값만 사용가능)
            gas: '250000', //사용될 가스?
            value: cav.utils.toPeb(amount, "KLAY") //payalbe이라 무조건 value값 필요 //html의 amount에서 받아온 klay단위를 peb로 변환 필요
          })
          .once('transactionHash', (txHash) => { //비동기 방식으로 정보를 받아올 수 잇다.
            console.log(`txHash: ${txHash}`); //해당 동작의 TX를 받아와 console에 출력
            alert("거래내역 : " + `${txHash}`); //컨트랙 송금 완료를 알리고
          })
          .once('receipt', async (receipt) => { //영수증 받아오기
            console.log(`(#${receipt.blockNumber})`, receipt); //영수증 출력시 블록에 추가 가능, 따라서 블록 확인가능

            //송금 성고시 스피너 스톱
            spinner.stop();


            //스터디의 contractGroup 업데이트
            var status = await App.setPaymentStatus(dbid, walletInstance.address);
            

            if(status.data)
            {
              console.log("DB setPaymentStatus update 성공");
              alert(amount + "KLAY를 컨트랙에 송금했습니다."); //컨트랙 송금 완료를 알리고
              location.reload();
            }
            else{
              console.log("DB setPaymentStatus update 실패");
              location.reload();
            }
          })
          .once('error', (error) => {
            alert(error.message); //TX기록 실패시 원인 알려줌
            location.reload();
          });
      }
      return; //amount가 없으면 그냥 종료
    }
  },  
  //모집 마감(완성)
  addGroupStudy: async function (id, limit) {
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();

    // 필요 변수 : 그룹 아이디, 제한 평점, 컨트랙에 담길 총 포인트, 참여자
    
    var _groupid = ''+id;
    var _limit = limit;
    var _point = 1000; //나눠 가질 포인트지만 현재 임시로 1000사용
    var _arr = [];
    var recvData = await this.getTempGroupStudentList(_groupid);
    for (var k in recvData)
    {
      _arr.push(recvData[k]['userAddress']);
    }

    if (!walletInstance) return;  
    agContract.methods.addGroupStudy(_groupid, _arr, _point, _limit).send({
         from : walletInstance.address,
         gas : "500000"
    }).then(async function(receipt){
      if(receipt.status){
        spinner.stop();

        console.log(receipt);
        
        var id = _groupid;
        var index =  receipt.events.addGroupStudyEvnet.returnValues.groupStudyNum;
        //스터디의 contractGroup 업데이트
        var status = await App.setContractIndex(id, index);

        if(status.data)
        {
          console.log("DB contract index update 성공");
          alert("그룹스터디 추가 성공! : "+walletInstance.address + " : " + receipt.transactionHash);
          location.reload();
        }
        else{
          console.log("DB contract index update 실패");
          location.reload();
        }
      }
    });

  },
  //스터디 그룹용 페이지로 이동
  moveGroupPage: function(id) {
    sessionStorage.setItem('groupId', id);
    location.href="/studyGroup.html";
  },

  //스터디 마감 버튼 동작
  EndGroup: async function(contractid, dbid) {

    //그룹원들 별 참여 평점 배열 반환[컨트랙 그룹의 학생 Index, 지갑 주소, 평점합, 유저 이름]
    var recvArray = await this.getGroupAllUserTotalScore(dbid, contractid);
    //랭킹 배열 만들기 (컨트랙의 그룹 내부 학생  Address 배열)
    var Rangking = [];
    for( var k in recvArray )
    {
      Rangking.push(recvArray[k][1]);
    }
    await this.closeStudy(contractid, Rangking, dbid);
  },

  //컨트랙트 스터디 종료 동작 함수
  closeStudy: async function (index, ranking, dbid) {
    // **  함수구현 미완료 테스트 중…
    var spinner = this.showSpinner();
    const walletInstance = this.getWallet();
    var arr = ranking;
    if (!walletInstance) return;  

    agContract.methods.closeStudy(index,arr).send({
         from : walletInstance.address,
         gas : "200000"
    }).once('transactionHash', (txHash) => { //비동기 방식으로 정보를 받아올 수 잇다.
      console.log(`txHash: ${txHash}`); //해당 동작의 TX를 받아와 console에 출력
      alert("거래내역 : " + `${txHash}`); //컨트랙 송금 완료를 알리고
    })
    .once('receipt', async (receipt) => { //영수증 받아오기
      console.log(`(#${receipt.blockNumber})`, receipt); //영수증 출력시 블록에 추가 가능, 따라서 블록 확인가능

      spinner.stop();

      if(receipt.status){
        console.log(receipt);
        var status = await this.setContractLive(dbid);
        console.log("test");
        console.log(status);
        if(status.data){
          console.log("DB setPaymentStatus update 성공");
          alert("마감 성공! : "+walletInstance.address + " : " + receipt.transactionHash);
          location.reload();
        }
        else{
          console.log("DB setPaymentStatus update 실패");
          alert("마감 실패! : "+walletInstance.address + " : " + receipt.transactionHash);
          location.reload();
        }
      } else{
        console.log(recipt)
        alert("마감 실패! : "+walletInstance.address + " : " + receipt.transactionHash);
        location.reload();
      }
    })
    .once('error', (error) => {
      alert(error.message); //TX기록 실패시 원인 알려줌
      location.reload();
    });
  },
  ////////////동작 관련 끝//////////////




  ////////////데이터 관련//////////////////////////////////////////

  //사용자의 임시 참여 목록 JSON 반환 (반환값 : id, studyName, studyGoal) // (완성)
  getUserTempGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getUserTempGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);

    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });

    return recvData;
  },
  //사용자의 미지불 그룹 목록 JSON 반환 (반환값 : id, studyName, studyGoal) // (완성)
  getUserHoldGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getUserHoldGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
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
  //사용자 임시 생성 목록 JSON 반환
  getCreateTempGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getCreateTempGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  //사용자 진행 스터디 목록 JSON 반환
  getCreateConfirmGroupList: async function (address) {
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'getCreateConfirmGroupList';
    var sendArray = {};
    sendArray['userAddress'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
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
  //컨트렉에 등록된 index DB에 등록
  setContractIndex: async function (id, index){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'setContractIndex';
    var sendArray = {};
    sendArray['groupid'] = id;
    sendArray['groupIndex'] = index;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });

    return recvData;
  },
  //컨트렉에 등록된 지불 상태 업데이트
  setPaymentStatus: async function (id, address){
    console.log('test');
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'setPaymentStatus';
    var sendArray = {};
    sendArray['id'] = id;
    sendArray['address'] = address;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });

    return recvData;
  },
  //컨트랙 id부르기
  getContractId: async function(id){
    var groupid = id;

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
  //해당 지갑에 해당하는 유저명 반환
  getName: async function(address){

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
  //스터디 마감 후 스터디의 상태 최신화
  setContractLive: async function(id){
    var url = 'http://mijuhome.iptime.org:5333/';
    var methods = 'setContractLive';
    var sendArray = {};
    sendArray['id'] = id;
    var sendData = JSON.stringify(sendArray);
    var recvData;
    await $.post(url + methods, {'data' : sendData }, function(data){
      recvData = JSON.parse(data);
    });
    return recvData;
  },
  
  //랭킹 가져오기, 해당 그룹 참여원 별로 평점 합 JSON 반환 (배열로 반환 [컨트랙 그룹의 학생 Index, 지갑 주소, 평점합, 유저 이름])
  getGroupAllUserTotalScore: async function(dbid, contractid){
    //컨트랙 그룹 소속원의 지갑 주소 배열 호출
    var addressArray = await this.getGroupStudyData(contractid);

    var array = new Array();
    for( var k in addressArray)
    {
      var url = 'http://mijuhome.iptime.org:5333/';
      var methods = 'getGroupUserTotalScore';
      var sendArray = {};
      sendArray['groupid'] = dbid;
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
          
      array.push([k, addressArray[k], num, name.userName]); 
    }
    
    array.sort(function(a,b)
    {
        return (a[2] - b[2]);
    });

    return array;
  },
  //컨트랙에서 스터디 소속원의 지갑 주소 순서대로 받아 오기
  getGroupStudyData: function(_index){
    return agContract.methods.getStudyDate(_index).call();
  },

 ////////////데이터 관련 끝//////////////////////////////////////////

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
