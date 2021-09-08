import * as express from "express"
import { EvanDIDResolver, EvanDIDDocument } from "@evan.network/did-resolver";
import { IdentityManager, DidElement } from "@equs/sidetree-api"
import { Element } from "@sidetree/element";

const config = {
  applicationWalletPrivateKey: process.env.APPLICATION_WALLET_PRIVATE_KEY,
  contentAddressableStoreServiceUri: process.env.CAS,
  databaseName: "",
  didMethodName: "evan",
  ethereumRpcUrl: process.env.ETH_RPC,
  mongoDbConnectionString: process.env.MONGO_DB,
  batchingIntervalInSeconds: 5,
  observingIntervalInSeconds: 5,
  maxConcurrentDownloads: 20,
  elementAnchorContract: "0x4e79165B56441ba67853198588049B1A99eCe857",
  versions: [
    {
      startingBlockchainTime: 0,
      version: "latest",
    },
  ],
};

let did: string;
let identityManager: IdentityManager;
let element: Element;

// Initilize side tree instance for Evan stack
(async () => {
  const element = await DidElement.initialize(config);
  identityManager = new IdentityManager(element);
  console.log('Element initialized', Boolean(element));
})();


const resolverTestcore = new EvanDIDResolver("https://testcore.evan.network/did/");
const resolverCore = new EvanDIDResolver("https://core.evan.network/did/");
const PORT = process.env.PORT;

const app = express();
app.get('/1.0/identifiers/:did', async (req, res) => {
  let didArray: string [] = (req.params.did).split(":");
  const didUniqueSuffix = didArray[didArray.length - 1];
  const implementationType = didUniqueSuffix.startsWith('0x') ? 'evan-vade' : 'evan-sidetree';

  let didDocument: EvanDIDDocument;
  switch (implementationType) {
    case 'evan-vade':
      if (req.params.did.startsWith('did:evan:testcore:')) { 
        didDocument = await resolverTestcore.resolveDid(req.params.did);
      } else {
        didDocument = await resolverCore.resolveDid(req.params.did);
      }

      if (didDocument) {
        res.send(didDocument);
      } else {
        res.sendStatus(404);
      }
      break;

    case 'evan-sidetree':
      // resolve using side tree
        identityManager.resolveBySuffix(didUniqueSuffix).then(didDocumentSidetree => {
            res.send(didDocumentSidetree);
        }).catch(e => {
          res.sendStatus({status:404, error: e.message});
        })
      break;  

    default:
      console.log('implementationType does not exist');
      break;
  }
});

app.listen(PORT, function () {
  console.log(`evan.network Resolver driver active on port ${ PORT }...`)
});
