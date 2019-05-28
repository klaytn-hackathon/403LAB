// Klaytn IDE uses solidity 0.4.24 version.
//얼마씩 처 집어넣었는지 랑 점수를 넣지 못한다는 점이 문제네
//클레이를 받는 부분
pragma solidity ^0.4.24;

contract GSPB {

    struct student{
        string name;
        uint point;
        uint[] attentStudies;
    }
    
    struct groupStudy{
        string name;
        address studyOwner;
        address[] participants;
        bool live; //private
        uint point;
        uint limit;
        mapping(address=> uint) payment;
        //price?
    }

    address owner;
    bool live;
    mapping(address => bool) public isJoin; //가입 여부 확인
    mapping(address => student) public students;
    groupStudy[] public groupStudyList;//mapping을 사용하는것이 더 좋을듯하다.

    event joinPlatformEvent(string _name, bool isJoin);
    event addGroupStudyEvnet(string _name, address[] _participants, uint _point, uint groupStudyNum);
    event closeStudyEvent(uint _index, uint[] ranking, uint klay);
    event depostieEvent(uint _index);

    constructor() public{
        owner = msg.sender;
    }
    //가입
    function joinPlatform(string _name) public{
        require(!isJoin[msg.sender]);
        uint[] memory x;
        students[msg.sender] = student(_name, 0, x);
        isJoin[msg.sender] = true;
        emit joinPlatformEvent(_name, isJoin[msg.sender]);
    }
    //스터디 생성
    function addGroupStudy(string _name, address[] _participants, uint _point, uint _limit)public {
        groupStudyList.push(groupStudy(_name, msg.sender, _participants, true, _point, _limit));
        for(uint i = 0; i < _participants.length; i++){
            students[_participants[i]].attentStudies.push(groupStudyList.length-1);
        }
        emit addGroupStudyEvnet(_name, _participants, _point, groupStudyList.length-1);
    }
    //현재 컨트랙에 포함된 모든 KLAY
    function getBalance() public view returns (uint){
        return address(this).balance;
    }
    //개인 마다 그룹스터디에 doposite한 KLAY를 저장
    function depostie(uint _index) public payable{
        groupStudyList[_index].payment[msg.sender] = msg.value;
        //스터디에 해당하는 사람만 보낼 수 있도록 하는 함수는 node.js에서 구현한느것이 좋다.
        //public로 해놔서 그냥 불서 볼 수 있다.
    }
    function closeStudy(uint _index, uint[] ranking) public returns (bool){
        require(groupStudyList[_index].live);
        require(msg.sender==groupStudyList[_index].studyOwner);
        uint returnKlay = 0;
        uint tmp = groupStudyList[_index].point;
        for(uint i = 0; i < ranking.length; i++){
            address target = groupStudyList[_index].participants[ranking[i]];
            uint fee = (groupStudyList[_index].payment[target])/10; //fee is 10%
            if (i == ranking.length-1){
                students[target].point = tmp;
            }
            tmp = tmp/2;
            students[target].point = tmp;
            target.transfer(groupStudyList[_index].payment[target]-fee);
            returnKlay += groupStudyList[_index].payment[target]-fee;
        }
        groupStudyList[_index].live = false;
        //클레이 재분배 0.9 만큼 일단 보낸다.
        emit closeStudyEvent( _index, ranking, returnKlay);
        
        return true;
        //평가를 web에서 모두 받고 관리자가 마무리를 누르면 오게된다.
    }
}
