import * as express from "express"
import { EvanDIDResolver, EvanDIDDocument, EvanSidetreeDidDocument} from "@evan.network/did-resolver";

const resolverTestcore = new EvanDIDResolver("https://testcore.evan.network/did/");
const resolverCore     = new EvanDIDResolver("https://core.evan.network/did/");
const resolverSideTree = new EvanDIDResolver("https://dev.uniresolver.io/1.0/identifiers/");

const PORT = process.env.PORT ?? 8090;

const app = express();
app.get('/1.0/identifiers/:did', async (req, res) => {
  let didArray: string [] = (req.params.did).split(":");
  const didUniqueSuffix = didArray[didArray.length - 1];
  const implementationType = didUniqueSuffix.startsWith('0x') ? 'evan-vade' : 'evan-sidetree';

  let didDocument: EvanDIDDocument | EvanSidetreeDidDocument;
  switch (implementationType) {
    case 'evan-vade':
      if (req.params.did.startsWith('did:evan:testcore:')) { 
        didDocument = await resolverTestcore.resolveDid(req.params.did);
      } else {
        didDocument = await resolverCore.resolveDid(req.params.did);
      }
      break;

    case 'evan-sidetree':
      // resolve using side tree
        didDocument = await resolverSideTree.resolveDid(req.params.did) as EvanSidetreeDidDocument;
      break;  

    default:
      console.log('implementationType does not exist');
      break;
  }

  if (didDocument) {
    res.send(didDocument);
  } else {
    res.sendStatus(404);
  }

});

app.listen(PORT, function () {
  console.log(`evan.network Resolver driver active on port ${ PORT }...`)
});
