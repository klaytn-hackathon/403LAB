// truffle.js config for klaytn. //환경 설정 : 배포할 네트워크를 설정
const PrivateKeyConnector = require('connect-privkey-to-provider')
const NETWORK_ID = '1001' //바오밥 고유 아이디
const GASLIMIT = '20000000'
const URL = 'https://api.baobab.klaytn.net:8651' //바오밥 네트워크
const PRIVATE_KEY = '0x6a153a4cd99bd575a7f9dfdd3308515d7187e4b15651d98c86a80432dcd76770' //test월렛 1

module.exports = {
    networks: {
        klaytn: { //클레이튼 사용 명시
            provider: new PrivateKeyConnector(PRIVATE_KEY, URL), //클레이튼 노드를 제공하는 공급자를 명시, 인스턴스 생성시 2가지 인자( 비밀키, 돌아가는 네트워크 주소)
            network_id: NETWORK_ID,
            gas: GASLIMIT,
            gasPrice: null, //바오밥 네트워크에서 자동으로 잡기에 null 사용
        }
    },
}
