// Klaytn IDE uses solidity 0.4.24 version.
//클레이를 받는 부분
pragma solidity ^0.4.24;

contract GSPB {

    struct student{
        string name;
        uint point;
    }
    
    struct groupStudy{
        string name;
        address studyOwner;
        address[] participants;
        bool live; //private
        uint point;
        mapping(address=> uint) payment;
        //price?
    }

    address owner;
    bool live;
    mapping(address => bool) public isJoin; //가입 여부 확인
    mapping(address => student) public students;
    groupStudy[] public groupStudyList;//mapping을 사용하는것이 더 좋을듯하다.

    event joinPlatformEvent(string _name);
    event addGroupStudyEvnet(string _name, address[] _participants, uint _point);
    event closeStudyEvent(uint _index, uint[] ranking);
    event depostieEvent(uint _index);


    constructor() public{
        owner = msg.sender;
    }
    //가입
    function joinPlatform(string _name) public{
        require(!isJoin[msg.sender]);
        students[msg.sender] = student(_name, 0);
        isJoin[msg.sender] = true;
        emit joinPlatformEvent(_name);
    }
    //스터디 생성
    function addGroupStudy(string _name, address[] _participants, uint _point)public{
        groupStudyList.push(groupStudy(_name, msg.sender, _participants, true, _point));
        emit addGroupStudyEvnet(_name, _participants, _point);
    }
    //현재 컨트랙에 포함된 모든 KLAY
    function getBalance() public view returns (uint){
        return address(this).balance;
    }
    //개인 마다 그룹스터디에 doposite한 KLAY를 저장
    function depostie(uint _index) public payable{
        groupStudyList[_index].payment[msg.sender] = msg.value;
    }
    function closeStudy(uint _index, uint[] ranking) public returns (bool){
        require(!groupStudyList[_index].live);
        uint fee = 50000000000000000; //0.05 클레이
        //ranking이 순위대로 왔다고 생가가하고 분배를 한다. [2,3,1,0]
        uint tmp = groupStudyList[_index].point;
        require(msg.sender==groupStudyList[_index].studyOwner);
        for(uint i = 0; i < ranking.length; i++){
            address target = groupStudyList[_index].participants[ranking[i]];
            if (i == ranking.length-1){
                students[target].point = tmp;
            }
            tmp = tmp/2;
            students[target].point = tmp;
            target.transfer(groupStudyList[_index].payment[target]-fee);
        }
        return true;
        //평가를 web에서 모두 받고 관리자가 마무리를 누르면 오게된다.
    }
}
