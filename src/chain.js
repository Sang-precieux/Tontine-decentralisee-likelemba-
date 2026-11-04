import { BrowserProvider, Contract, JsonRpcProvider, formatUnits, isAddress } from 'ethers'
import { CHAIN_ID, CONTRACTS, RPC } from './config'

const tokenABI = [
 'function balanceOf(address) view returns (uint256)',
 'function decimals() view returns (uint8)',
 'function symbol() view returns (string)',
 'function allowance(address,address) view returns (uint256)',
 'function approve(address,uint256) returns (bool)',
 'function transfer(address,uint256) returns (bool)',
]

const likelembaReadABI = [
  'function nombreMembres() view returns (uint256)',
  'function organisateur() view returns (address)',
  'function estMembre(address) view returns (bool)',
  'function ajouterMembre(address _membre)',
]


  const caisseReadABI = [
  // Informations générales
  'function jeton() view returns (address)',
  'function administrateur() view returns (address)',
  'function COTISATION() view returns (uint256)',
  'function MAX_PARTICIPANTS() view returns (uint256)',

  // Participants
  'function nombreParticipants() view returns (uint256)',
  'function listeParticipants() view returns (address[])',
  'function estParticipant(address) view returns (bool)',

  // Inscriptions
  'function inscriptionsFermees() view returns (bool)',
  'function ajouterParticipant(address)',
  'function fermerInscriptions()',

  // Gestion des tours
  'function tour() view returns (uint256)',
  'function beneficiaireTour() view returns (address)',
  'function cycleTermine() view returns (bool)',

  // Cotisations
  'function nombreCotisationsTour() view returns (uint256)',
  'function cotisationsRestantes() view returns (uint256)',
  'function aCotise(uint256,address) view returns (bool)',
  'function cotiser()',

  // Finances
  'function soldeCaisse() view returns (uint256)',
  'function distribuer()'
]
export const short = (s) => s ? `${s.slice(0,6)}…${s.slice(-4)}` : '—'
export const publicProvider = () => new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true })
console.log('ADRESSES LIKELEMBA :', CONTRACTS)
console.log('VALIDITÉ DES ADRESSES :', {
  mockUSD: isAddress(CONTRACTS.mockUSD),
  likelemba: isAddress(CONTRACTS.likelemba),
  caisse: isAddress(CONTRACTS.caisse)
})

export async function getReadData(address) {
  const p = publicProvider()

  const [block, codeToken, codeLikelemba, codeCaisse] =
    await Promise.all([
      p.getBlockNumber(),
      p.getCode(CONTRACTS.mockUSD),
      p.getCode(CONTRACTS.likelemba),
      p.getCode(CONTRACTS.caisse)
    ])

  const deployed = {
    mockUSD: codeToken !== '0x',
    likelemba: codeLikelemba !== '0x',
    caisse: codeCaisse !== '0x'
  }

  const results = {
    block,
    deployed,
    tokenBalance: null,
    symbol: 'mUSD',
    members: null,
    organizer: null,
    contribution: null,
    beneficiary: null,
    isMember: null,
    isParticipant: null,
    participants: [],
    inscriptionsFermees: null,
    tour: null,
    soldeCaisse: null,
    tourEnCours: null,
    cycleTermine: null,
    nombreCotisationsTour: null,
    nombreCotisationsAttendues: null,
    cotisationsRestantes: null
  }

  async function optional(contract, method, ...args) {
    try {
      return await contract[method](...args)
    } catch (e) {
      console.warn(`Lecture impossible : ${method}`, e)
      return null
    }
  }

  // NOUVELLE CAISSE LIKELEMBA V2
  if (deployed.caisse) {
  const c = new Contract(
  CONTRACTS.caisse,
  caisseReadABI,
  p
)


// Lecture directe des informations financières V2
const montantCotisationV2 = await c.COTISATION()
const soldeCaisseV2 = await c.soldeCaisse()

// Enregistrer les valeurs pour le tableau de bord
results.contribution = formatUnits(montantCotisationV2, 18)
results.soldeCaisse = formatUnits(soldeCaisseV2, 18)
    

const [
  admin,
  nombre,
  liste,
  inscrit,
  fermees,
  tour
] = await Promise.all([
  optional(c, 'administrateur'),
  optional(c, 'nombreParticipants'),
  optional(c, 'listeParticipants'),
  address ? optional(c, 'estParticipant', address) : null,
  optional(c, 'inscriptionsFermees'),
  optional(c, 'tour')
])

// Lire directement la cotisation et le solde
const cotisation = await c.COTISATION()
const solde = await c.soldeCaisse()

// Lire le bénéficiaire seulement
// lorsque les inscriptions sont fermées
const beneficiaire = fermees === true
  ? await optional(c, 'beneficiaireTour')
  : null



    results.organizer = admin
    results.members = nombre === null ? null : nombre.toString()
    results.participants = liste || []
    results.isParticipant = inscrit
    results.isMember = inscrit
   const cycleEstTermine = await optional(c, 'cycleTermine')
const limiteParticipants = await optional(c, 'MAX_PARTICIPANTS')

results.inscriptionsFermees =
  fermees === null || cycleEstTermine === null ||
  nombre === null || limiteParticipants === null
    ? true
    : fermees ||
      cycleEstTermine ||
      nombre >= limiteParticipants
    results.tour = tour === null ? null : tour.toString()
    results.beneficiary = beneficiaire
    // Informations supplementaires de Likelemba V3
// Ces lectures restent facultatives tant que V2 est connecte.


    // Informations des tours - Likelemba V2

    const [
      etatCycle,
      cotisationsRecues,
      cotisationsManquantes
    ] = await Promise.all([
      optional(c, 'cycleTermine'),
      optional(c, 'nombreCotisationsTour'),
      optional(c, 'cotisationsRestantes')
    ])

    // État du cycle
    results.cycleTermine = etatCycle

    // Dans V2, les cotisations commencent
    // après la fermeture des inscriptions
    results.tourEnCours =
      fermees === null || etatCycle === null
        ? null
        : fermees && !etatCycle

    // Cotisations déjà reçues
    results.nombreCotisationsTour =
      cotisationsRecues === null
        ? null
        : cotisationsRecues.toString()

    // Dans V2, tous les membres doivent cotiser
    results.nombreCotisationsAttendues =
      nombre === null
        ? null
        : nombre.toString()

    // Cotisations restantes
    results.cotisationsRestantes =
      cotisationsManquantes === null
        ? null
        : cotisationsManquantes.toString()

  }

  // SOLDE DU JETON mUSD
  if (deployed.mockUSD) {
    const token = new Contract(
      CONTRACTS.mockUSD,
      tokenABI,
      p
    )

    const [symbol, decimals, balance] = await Promise.all([
      optional(token, 'symbol'),
      optional(token, 'decimals'),
      address ? optional(token, 'balanceOf', address) : null
    ])

    results.symbol = symbol || 'mUSD'

    if (balance !== null) {
      results.tokenBalance = formatUnits(
        balance,
        decimals === null ? 18 : decimals
      )
    }
  }
console.log("DEBUG COTISATION :", results.contribution)
console.log("DEBUG SOLDE CAISSE :", results.soldeCaisse)

  return results
}

export async function connectWallet(){
 if(!window.ethereum) throw new Error('MetaMask est introuvable. Installe son extension dans ce navigateur.')
 const provider=new BrowserProvider(window.ethereum)
 await provider.send('eth_requestAccounts',[])
 const network=await provider.getNetwork()
 if(Number(network.chainId)!==CHAIN_ID) throw new Error('Sélectionne Ethereum Sepolia dans MetaMask avant de continuer.')
 const signer=await provider.getSigner()
 return {address:await signer.getAddress(),provider}
}
export async function switchToSepolia(){
 if(!window.ethereum) throw new Error('MetaMask est introuvable.')
 await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xaa36a7'}]})
}
export function validateAddress(address){return isAddress(address)}

export async function effectuerCotisation() {
  if (!window.ethereum) {
    throw new Error("MetaMask est introuvable.")
  }

  const provider = new BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()

  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error("Sélectionne Ethereum Sepolia dans MetaMask.")
  }

  const signer = await provider.getSigner()
  const adresse = await signer.getAddress()

  const token = new Contract(CONTRACTS.mockUSD, tokenABI, signer)


  const caisse = new Contract(
  CONTRACTS.caisse,
  caisseReadABI,
  signer
  
)
// Vérifier que le jeton utilisé par l'application
// est bien celui du contrat Likelemba V3
const jetonDuContrat = await caisse.jeton()

if (
  jetonDuContrat.toLowerCase() !==
  CONTRACTS.mockUSD.toLowerCase()
) {
  throw new Error(
    "Le jeton mUSD ne correspond pas au jeton de la caisse V3."
  )
}


  const participant = await caisse.estParticipant(adresse)

  if (!participant) {
    throw new Error("Ce portefeuille ne participe pas à cette tontine.")
  }

  // Vérifier que les inscriptions sont fermées
const inscriptionsFermees = await caisse.inscriptionsFermees()

if (!inscriptionsFermees) {
  throw new Error(
    "Les cotisations ne sont pas encore ouvertes. " +
    "L'administrateur doit d'abord fermer les inscriptions."
  )
}

// Vérifier que le cycle n'est pas terminé
if (await caisse.cycleTermine()) {
  throw new Error(
    "Le cycle de la tontine est terminé."
  )
}

// Récupérer le tour actuel
const tour = await caisse.tour()

// Vérifier que le membre n'a pas déjà cotisé
const dejaCotise = await caisse.aCotise(tour, adresse)

if (dejaCotise) {
  throw new Error(
    "Tu as déjà cotisé pour ce tour."
  )
}
  const montant = await caisse.COTISATION()
  const solde = await token.balanceOf(adresse)

  if (solde < montant) {
    throw new Error("Solde mUSD insuffisant pour cotiser.")
  }

  const autorisation = await token.allowance(
    adresse,
    CONTRACTS.caisse
  )

  if (autorisation < montant) {
    const transactionApprove = await token.approve(
      CONTRACTS.caisse,
      montant
    )

    await transactionApprove.wait()
  }

  const transaction = await caisse.cotiser()
  const confirmation = await transaction.wait()

  if (!confirmation || confirmation.status !== 1) {
    throw new Error("La cotisation n'a pas été confirmée.")
  }

  return transaction.hash
}




export async function inscrireMembre(adresseMembre) {
  if (!window.ethereum) {
    throw new Error("MetaMask est introuvable.")
  }

  if (!isAddress(adresseMembre)) {
    throw new Error("Adresse Ethereum invalide.")
  }

  const provider = new BrowserProvider(window.ethereum)

  const network = await provider.getNetwork()
  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error("Sélectionne Ethereum Sepolia.")
  }

  const signer = await provider.getSigner()
  const adresseConnectee = await signer.getAddress()

  const caisse = new Contract(
  CONTRACTS.caisse,
  caisseReadABI,
  signer
)
  const administrateur = await caisse.administrateur()

  if (
    adresseConnectee.toLowerCase() !==
    administrateur.toLowerCase()
  ) {
    throw new Error(
      "Seul l'administrateur peut inscrire un participant."
    )
  }

  if (await caisse.inscriptionsFermees()) {
  throw new Error(
    "Les inscriptions sont fermées. Impossible d'ajouter un membre."
  )
}

  if (await caisse.estParticipant(adresseMembre)) {
    throw new Error("Ce participant est déjà inscrit.")
  }
  const nombre = await caisse.nombreParticipants()
const maximum = await caisse.MAX_PARTICIPANTS()

if (nombre >= maximum) {
  throw new Error(
    "La tontine a atteint la limite de 20 participants."
  )
}


  const transaction = await caisse.ajouterParticipant(
    adresseMembre
  )

  const confirmation = await transaction.wait()

  if (!confirmation || confirmation.status !== 1) {
    throw new Error("Inscription non confirmée.")
  }

  return transaction.hash
}


export async function supprimerMembre(adresseMembre) {
  if (!window.ethereum) {
    throw new Error("MetaMask est introuvable.")
  }

  if (!isAddress(adresseMembre)) {
    throw new Error("Adresse Ethereum invalide.")
  }

  const provider = new BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()

  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error("Sélectionne Ethereum Sepolia.")
  }

  const signer = await provider.getSigner()
  const adresseConnectee = await signer.getAddress()

  const caisse = new Contract(
    CONTRACTS.caisse,
    caisseReadABI,
    signer
  )

  const administrateur = await caisse.administrateur()

  if (
    adresseConnectee.toLowerCase() !==
    administrateur.toLowerCase()
  ) {
    throw new Error(
      "Seul l'administrateur peut supprimer un membre."
    )
  }

  if (await caisse.tourEnCours()) {
    throw new Error(
      "Suppression impossible pendant un tour."
    )
  }

  if (await caisse.cycleTermine()) {
    throw new Error(
      "Le cycle de la tontine est terminé."
    )
  }

  if (!(await caisse.estParticipant(adresseMembre))) {
    throw new Error("Ce membre n'est pas inscrit.")
  }

  if (await caisse.aDejaCotise(adresseMembre)) {
    throw new Error(
      "Impossible : ce membre a déjà cotisé."
    )
  }

  if (await caisse.aRecuCagnotte(adresseMembre)) {
    throw new Error(
      "Impossible : ce membre a déjà reçu sa cagnotte."
    )
  }
  const participants = await caisse.listeParticipants()
const tourActuel = await caisse.tour()

const position = participants.findIndex(
  (adresse) =>
    adresse.toLowerCase() === adresseMembre.toLowerCase()
)

if (
  position === -1 ||
  BigInt(position) < tourActuel - 1n
) {
  throw new Error(
    "Suppression impossible : le tour de ce membre est déjà passé."
  )
}

  const transaction = await caisse.supprimerParticipant(
    adresseMembre
  )

  const confirmation = await transaction.wait()

  if (!confirmation || confirmation.status !== 1) {
    throw new Error("Suppression non confirmée.")
  }

  return transaction.hash
}



export async function fermerInscriptions() {
  if (!window.ethereum) {
    throw new Error("MetaMask est introuvable.")
  }

  const provider = new BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()

  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error("Sélectionne Ethereum Sepolia.")
  }

  const signer = await provider.getSigner()
  const adresseConnectee = await signer.getAddress()

  const caisse = new Contract(
    CONTRACTS.caisse,
    caisseReadABI,
    signer
  )

  // Vérifier les droits de l'administrateur
  const administrateur = await caisse.administrateur()

  if (
    adresseConnectee.toLowerCase() !==
    administrateur.toLowerCase()
  ) {
    throw new Error(
      "Seul l'administrateur peut fermer les inscriptions."
    )
  }

  // Vérifier que les inscriptions sont ouvertes
  if (await caisse.inscriptionsFermees()) {
    throw new Error("Les inscriptions sont déjà fermées.")
  }

  // Vérifier le nombre minimum de participants
  const nombre = await caisse.nombreParticipants()

  if (nombre < 2n) {
    throw new Error(
      "Il faut au minimum 2 participants pour commencer la tontine."
    )
  }

  // Fermer les inscriptions sur la blockchain
  const transaction = await caisse.fermerInscriptions()
  const confirmation = await transaction.wait()

  if (!confirmation || confirmation.status !== 1) {
    throw new Error(
      "La fermeture des inscriptions n'a pas été confirmée."
    )
  }

  return transaction.hash
}

// Compatibilité temporaire avec App.jsx
export const demarrerTour = fermerInscriptions




export async function distribuerCagnotte() {
  if (!window.ethereum) {
    throw new Error("MetaMask est introuvable.")
  }

  const provider = new BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()

  if (Number(network.chainId) !== CHAIN_ID) {
    throw new Error("Sélectionne Ethereum Sepolia.")
  }

  const signer = await provider.getSigner()
  const adresseConnectee = await signer.getAddress()

  const caisse = new Contract(
    CONTRACTS.caisse,
    caisseReadABI,
    signer
  )

  // 1. Vérifier l'administrateur
  const administrateur = await caisse.administrateur()

  if (
    adresseConnectee.toLowerCase() !==
    administrateur.toLowerCase()
  ) {
    throw new Error(
      "Seul l'administrateur peut distribuer la cagnotte."
    )
  }

  // 2. Vérifier les inscriptions
  if (!(await caisse.inscriptionsFermees())) {
    throw new Error(
      "Les inscriptions doivent d'abord être fermées."
    )
  }

  // 3. Vérifier la fin du cycle
  if (await caisse.cycleTermine()) {
    throw new Error(
      "Le cycle de la tontine est terminé."
    )
  }

  // 4. Vérifier toutes les cotisations
  const cotisationsRecues =
    await caisse.nombreCotisationsTour()

  const nombreParticipants =
    await caisse.nombreParticipants()

  if (cotisationsRecues !== nombreParticipants) {
    throw new Error(
      `Cotisations incomplètes : ${cotisationsRecues} sur ${nombreParticipants}.`
    )
  }

  // 5. Identifier le bénéficiaire
  const beneficiaire = await caisse.beneficiaireTour()
  const cotisation = await caisse.COTISATION()

  const montantTotal = cotisation * nombreParticipants

  // 6. Distribuer la cagnotte
  const transaction = await caisse.distribuer()
  const confirmation = await transaction.wait()

  if (!confirmation || confirmation.status !== 1) {
    throw new Error(
      "La distribution n'a pas été confirmée."
    )
  }

  return {
    hash: transaction.hash,
    beneficiaire,
    montant: formatUnits(montantTotal, 18)
  }
}



