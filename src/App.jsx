import React,{useEffect,useState,useCallback} from 'react'
import {LayoutDashboard,Users,Wallet,ArrowLeftRight,History,Settings,ShieldCheck,ExternalLink,Copy,RefreshCw,Menu,X,LogIn,Coins,Landmark,CheckCircle2,AlertCircle,Globe2,Info} from 'lucide-react'
import {CONTRACTS,EXPLORER} from './config'

import {
  connectWallet,
  getReadData,
  short,
  switchToSepolia,
  effectuerCotisation,
  inscrireMembre,
  supprimerMembre,
  demarrerTour,
  distribuerCagnotte
} from './chain'

const pages=[['dashboard','Tableau de bord',LayoutDashboard],['members','Membres',Users],['contributions','Cotisations',Coins],['turns','Tours & bénéficiaires',ArrowLeftRight],['history','Transactions',History],['settings','Contrats & réseau',Settings]]
const empty={block:null,deployed:{},tokenBalance:null,symbol:'mUSD',members:null,organizer:null,contribution:null,beneficiary:null,isMember:null,isParticipant:null,participants:[]}
function Explorer({address,children}){return <a className="external" href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer">{children||short(address)} <ExternalLink size={13}/></a>}
function Panel({title,subtitle,children}){return <section className="panel"><div className="panel-head"><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{children}</section>}
function Status({yes}){return <span className={`status ${yes?'good':'muted'}`}>{yes?'Contrat détecté':'Non détecté'}</span>}
function CopyButton({value}){const [done,setDone]=useState(false);return <button className="icon-button" title="Copier" onClick={async()=>{try{await navigator.clipboard.writeText(value);setDone(true);setTimeout(()=>setDone(false),1500)}catch{}}}>{done?<CheckCircle2 size={15}/>:<Copy size={15}/>}</button>}
export default function App(){
 const [page,setPage]=useState('dashboard'),[mobile,setMobile]=useState(false),[wallet,setWallet]=useState(''),[data,setData]=useState(empty),[loading,setLoading]=useState(false),[error,setError]=useState(''),[lastUpdate,setLastUpdate]=useState(null)
 const [paiementEnCours, setPaiementEnCours] = useState(false)
const [nouveauMembre, setNouveauMembre] = useState('')
const [inscriptionEnCours, setInscriptionEnCours] = useState(false)
const [suppressionEnCours, setSuppressionEnCours] = useState('')
const [suppressionMessage, setSuppressionMessage] = useState('')
const [demarrageEnCours, setDemarrageEnCours] = useState(false)
const [distributionEnCours, setDistributionEnCours] = useState(false)
 const refresh=useCallback(async(address=wallet)=>{setLoading(true);setError('');try{const d=await getReadData(address);setData(d);setLastUpdate(new Date())}catch(e){console.error('ERREUR LIKELEMBA SEPOLIA :', e);setError('Lecture de Sepolia indisponible : '+(e.shortMessage||e.message))}finally{setLoading(false)}},[wallet])
 useEffect(()=>{refresh('')},[])
 useEffect(()=>{if(!window.ethereum)return;const change=()=>{setWallet('');refresh('')};window.ethereum.on?.('accountsChanged',change);window.ethereum.on?.('chainChanged',change);return()=>{window.ethereum.removeListener?.('accountsChanged',change);window.ethereum.removeListener?.('chainChanged',change)}},[refresh])
 const connect=async()=>{setError('');try{const result=await connectWallet();setWallet(result.address);await refresh(result.address)}catch(e){setError(e.shortMessage||e.message)}}
 
const payerCotisation = async () => {
  if (!wallet) {
    setError("Connecte d'abord ton portefeuille MetaMask.")
    return
  }

  setPaiementEnCours(true)
  setError('')

  try {
    const hash = await effectuerCotisation()

    await refresh(wallet)

    alert(
      "Cotisation confirmée sur Sepolia !\n\n" +
      "Transaction : " + hash
    )
  } catch (e) {
    console.error("Erreur de cotisation :", e)
    setError(
      "Cotisation non effectuée : " +
      (e.shortMessage || e.message)
    )
  } finally {
    setPaiementEnCours(false)
  }
}

const ajouterNouveauMembre = async () => {
  if (!wallet) {
    setError("Connecte d'abord MetaMask.")
    return
  }

  if (!nouveauMembre.trim()) {
    setError("Saisis l'adresse du nouveau membre.")
    return
  }

  setInscriptionEnCours(true)
  setError('')

  try {
    const hash = await inscrireMembre(nouveauMembre.trim())

    await refresh(wallet)
    setNouveauMembre('')

    alert(
      "Membre inscrit avec succès sur Sepolia !\n\n" +
      "Transaction : " + hash
    )
  } catch (e) {
    console.error("Erreur d'inscription :", e)

    setError(
      "Inscription impossible : " +
      (e.shortMessage || e.message)
    )
  } finally {
    setInscriptionEnCours(false)
  }
}

const supprimerUnMembre = async (adresse) => {
  if (!wallet) {
    setError("Connecte d'abord MetaMask.")
    return
  }

  const confirmation = window.confirm(
    `Voulez-vous vraiment supprimer ce membre ?\n\n${adresse}`
  )

  if (!confirmation) return

  setSuppressionEnCours(adresse)
  setSuppressionMessage('')
  setError('')

  try {
    const hash = await supprimerMembre(adresse)

    await refresh(wallet)

    setSuppressionMessage(
      `Membre supprimé avec succès. Transaction : ${hash}`
    )
  } catch (e) {
    console.error("Erreur de suppression :", e)

    setError(
      "Suppression impossible : " +
      (e.shortMessage || e.message)
    )
  } finally {
    setSuppressionEnCours('')
  }
}

const lancerUnTour = async () => {
  if (!wallet) {
    setError("Connecte d'abord MetaMask.")
    return
  }

  setDemarrageEnCours(true)
  setError('')

  try {
    const hash = await demarrerTour()

    await refresh(wallet)

    alert(
      "Les inscriptions sont fermées ! Les participants peuvent maintenant cotiser.\n\n"+
      "Transaction : " + hash
    )
  } catch (e) {
    console.error("Erreur de démarrage :", e)

    setError(
      "Démarrage impossible : " +
      (e.shortMessage || e.message)
    )
  } finally {
    setDemarrageEnCours(false)
  }
}

const envoyerCagnotte = async () => {
  if (!wallet) {
    setError("Connecte d'abord MetaMask.")
    return
  }

  const confirmation = window.confirm(
    "Confirmer la distribution de la cagnotte au bénéficiaire du tour ?"
  )

  if (!confirmation) return

  setDistributionEnCours(true)
  setError('')

  try {
    const resultat = await distribuerCagnotte()

    await refresh(wallet)

    alert(
      "Cagnotte distribuée avec succès !\n\n" +
      "Bénéficiaire : " + resultat.beneficiaire + "\n" +
      "Montant : " + resultat.montant + " mUSD\n" +
      "Transaction : " + resultat.hash
    )
  } catch (e) {
    console.error("Erreur de distribution :", e)

    setError(
      "Distribution impossible : " +
      (e.shortMessage || e.message)
    )
  } finally {
    setDistributionEnCours(false)
  }
}


 const nav=(id)=>{setPage(id);setMobile(false)}
 return <div className="app-shell">
 <aside className={`sidebar ${mobile?'open':''}`}><div className="brand"><div className="brand-icon"><Landmark size={25}/></div><div><strong>Likelemba</strong><small>Épargne solidaire 3.0</small></div><button className="close-mobile" onClick={()=>setMobile(false)}><X/></button></div><div className="side-label">ESPACE DE GESTION</div><nav>{pages.map(([id,label,Icon])=><button key={id} className={`nav-link ${page===id?'active':''}`} onClick={()=>nav(id)}><Icon size={19}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="network-pill"><span className="live-dot"/> Ethereum Sepolia</div><p>Réseau de test · Aucun argent réel</p></div></aside>
 {mobile&&<div className="overlay" onClick={()=>setMobile(false)}/>}
 <main className="main"><header className="topbar"><div className="top-left"><button className="menu-mobile" onClick={()=>setMobile(true)}><Menu/></button><span className="crumb">Plateforme / <b>{pages.find(p=>p[0]===page)?.[1]}</b></span></div><div className="top-actions"><span className="testnet-tag"><Globe2 size={14}/> Sepolia</span><button className="wallet-button" onClick={connect}>{wallet?<><span className="wallet-dot"/>{short(wallet)}</>:<><Wallet size={17}/> Connecter MetaMask</>}</button></div></header>
 <div className="content"><div className="heading"><div><span className="eyebrow">LIKELEMBA · BLOCKCHAIN</span><h1>{pages.find(p=>p[0]===page)?.[1]}</h1><p>Votre tontine, transparente et sécurisée par les contrats intelligents.</p></div><button className="refresh-button" disabled={loading} onClick={()=>refresh()}><RefreshCw size={16} className={loading?'spin':''}/> Actualiser</button></div>
 {error&&<div className="alert"><AlertCircle size={19}/><span>{error}</span><button onClick={()=>setError('')}><X size={16}/></button></div>}
 {page==='dashboard'&&<><div className="hero"><div><span className="hero-kicker">Bienvenue sur votre espace</span><h2>L'épargne collective,<br/><em>en toute confiance.</em></h2><p>Suivez votre tontine en temps réel grâce à Ethereum Sepolia.</p><button className="hero-cta" onClick={wallet?()=>nav('contributions'):connect}>{wallet?'Voir les cotisations':'Connecter mon portefeuille'} <span>→</span></button></div><div className="hero-illustration"><div className="coin coin1">L</div><div className="coin coin2">◎</div><div className="hero-orbit"/></div></div>
 <div className="stats"><div className="stat"><div className="stat-icon purple"><Users size={21}/></div><span>Membres enregistrés</span><strong>{data.members??'—'}</strong><small>Selon le contrat Likelemba</small></div><div className="stat"><div className="stat-icon teal"><Wallet size={21}/></div><span>Mon solde {data.symbol}</span><strong>{wallet&&data.tokenBalance!==null?Number(data.tokenBalance).toLocaleString('fr-FR',{maximumFractionDigits:4}):'—'}</strong><small>{wallet?'Solde lu sur Sepolia':'Connectez votre portefeuille'}</small></div><div className="stat"><div className="stat-icon gold"><Coins size={21}/></div><span>Cotisation (unité brute)</span><strong>{data.contribution??'—'}</strong><small>Valeur du contrat, si disponible</small></div><div className="stat"><div className="stat-icon blue"><ShieldCheck size={21}/></div><span>Contrats accessibles</span><strong>{Object.values(data.deployed).filter(Boolean).length}/3</strong><small>Contrats trouvés sur Sepolia</small></div></div>
 
<div className="stats">
  <div className="stat">
    <div className="stat-icon teal">
      <Wallet size={21} />
    </div>
    <span>Solde de la caisse</span>
    <strong>
      {data.soldeCaisse !== null
        ? `${data.soldeCaisse} mUSD`
        : '—'}
    </strong>
    <small>Solde réel sur Sepolia</small>
  </div>

  <div className="stat">
    <div className="stat-icon purple">
      <ArrowLeftRight size={21} />
    </div>
    <span>Tour actuel</span>
    <strong>{data.tour ?? '—'}</strong>
    <small>Selon le contrat intelligent</small>
  </div>

  <div className="stat">
    <div className="stat-icon gold">
      <Users size={21} />
    </div>
    <span>État des inscriptions</span>
    <strong>
      {data.inscriptionsFermees === null
        ? 'Indisponible'
        : data.inscriptionsFermees
          ? 'Fermées'
          : 'Ouvertes'}
    </strong>
    <small>État enregistré sur Sepolia</small>
  </div>
</div>

 <div className="two-col"><Panel title="État de la blockchain" subtitle="Données publiques, sans simulation"><div className="detail-line"><span>Réseau</span><b>Ethereum Sepolia</b></div><div className="detail-line"><span>Dernier bloc consulté</span><b>{data.block?.toLocaleString('fr-FR')??'—'}</b></div><div className="detail-line"><span>Organisateur</span><b>{data.organizer?<Explorer address={data.organizer}/>: 'À vérifier dans le contrat'}</b></div><div className="detail-line"><span>Mon statut</span><b>{wallet?(data.isMember===null?'À vérifier':data.isMember?'Membre':'Non membre'):'Portefeuille non connecté'}</b></div></Panel><Panel title="Accès rapide" subtitle="Consultez les informations de votre tontine"><div className="quick-links"><button onClick={()=>nav('members')}><Users size={19}/><span>Membres</span><span>→</span></button><button onClick={()=>nav('contributions')}><Coins size={19}/><span>Cotisations</span><span>→</span></button><button onClick={()=>nav('settings')}><Settings size={19}/><span>Contrats</span><span>→</span></button></div></Panel></div></>}
 {page==='members'&&<div className="two-col"><Panel title="Informations des membres" subtitle="Lecture des données du contrat Likelemba"><div className="feature-number">{data.members??'—'} <small>membres</small></div><div className="detail-line"><span>Organisateur</span><b>{data.organizer?<Explorer address={data.organizer}/>: 'Indisponible'}</b></div><div className="detail-line"><span>Votre statut</span><b>{!wallet?'Connectez MetaMask':data.isMember===null?'Non disponible':data.isMember?'Inscrit':'Non inscrit'}</b></div>
</Panel>

<Panel
  title="Participants de la tontine"
  subtitle="Adresses enregistrées sur Ethereum Sepolia"
>
  {data.participants?.length > 0 ? (
    <div>
      {data.participants.map((adresse, index) => (
        <div className="detail-line" key={adresse}>
          <span>Participant {index + 1}</span>
          
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
}}>
  <b>
    <Explorer address={adresse} />
  </b>

  
</div>
{suppressionMessage && (
  <p className="panel-copy">
    {suppressionMessage}
  </p>
)}
        </div>
      ))}
    </div>
  ) : (
    <p className="panel-copy">
      Aucun participant disponible pour le moment.
    </p>
  )}
</Panel>


<Panel
  title="Ajouter un nouveau membre"
  subtitle="Inscription sur Ethereum Sepolia"
>
  <div className="info-note">
    <Info size={19} />
    <p>
      Seul l'organisateur peut inscrire un membre
      dans le contrat Likelemba.
    </p>
  </div>

  <form
    onSubmit={(e) => {
      e.preventDefault()
      ajouterNouveauMembre()
    }}
  >
    <label htmlFor="adresse-membre">
      Adresse MetaMask du nouveau membre
    </label>

    <input
      id="adresse-membre"
      type="text"
      placeholder="0x..."
      value={nouveauMembre}
      onChange={(e) => setNouveauMembre(e.target.value)}
      disabled={inscriptionEnCours}
      required
      style={{
        width: '100%',
        padding: '12px',
        marginTop: '10px',
        marginBottom: '15px',
        borderRadius: '8px'
      }}
    />

    <button
      type="submit"
      className="secondary-button"
      disabled={
  !wallet ||
  inscriptionEnCours ||
  !data.organizer ||
  wallet.toLowerCase() !== data.organizer.toLowerCase() ||
  data.tourEnCours !== false ||
  data.cycleTermine !== false ||
  data.inscriptionsFermees !== false ||
  Number(data.members) >= 20
}
    >
      <Users size={17} />
      {inscriptionEnCours
        ? 'Inscription en cours...'
        : 'Ajouter le membre'}
    </button>
  </form>

  <p className="panel-copy">
  Seul l'administrateur peut inscrire de nouveaux membres.
  Une fois les inscriptions fermées, aucun nouveau
  participant ne pourra être ajouté.
</p>
</Panel>
</div>}
 {page==='contributions'&&<div className="two-col"><Panel title="Votre portefeuille" subtitle="Données du jeton de test"><div className="balance-display"><span>Solde disponible</span><strong>{wallet&&data.tokenBalance!==null?Number(data.tokenBalance).toLocaleString('fr-FR',{maximumFractionDigits:6}):'—'} <small>{data.symbol}</small></strong></div><div className="detail-line"><span>Jeton</span><Explorer address={CONTRACTS.mockUSD}/></div><div className="detail-line"><span>Montant de cotisation (brut)</span><b>{data.contribution??'Non disponible'}</b></div></Panel><Panel title="Verser une cotisation" subtitle="Cotisation de 10 mUSD via MetaMask"><div className="info-note">
  <Info size={19} />
  <p>
    Chaque cotisation est de 10 mUSD.
    Le paiement nécessite un tour actif et
    une confirmation dans MetaMask.
    Le contrat vérifie votre participation
    et empêche une double cotisation.
  </p>
</div><button
  className="secondary-button"
 disabled={
  !wallet ||
  paiementEnCours ||
  data.isParticipant !== true ||
  data.inscriptionsFermees !== true ||
  data.cycleTermine !== false ||
  data.cotisationsRestantes === null ||
  Number(data.cotisationsRestantes) <= 0
}

  onClick={payerCotisation}
>
  <Coins size={17}/>
  {paiementEnCours
  ? 'Transaction en cours...'
  : !wallet
    ? 'Connecter MetaMask'
    : data.isParticipant !== true
      ? 'Portefeuille non participant'
      : data.cycleTermine === true
        ? 'Cycle terminé'
        : data.inscriptionsFermees !== true
          ? 'En attente de fermeture des inscriptions'
          : 'Cotiser 10 mUSD'}
</button>
</Panel>
</div>}
 {page==='turns'&&<div className="two-col"><Panel title="Bénéficiaire actuel" subtitle="Lecture depuis le contrat de caisse"><div className="beneficiary-icon"><ArrowLeftRight size={28}/></div><h3>{data.beneficiary?short(data.beneficiary):'Information indisponible'}</h3>{data.beneficiary&&<Explorer address={data.beneficiary}>Consulter le bénéficiaire</Explorer>}<p className="panel-copy">
  Chaque membre cotise 10 mUSD par tour.
  Lorsque tous les membres ont cotisé,
  l'administrateur distribue la cagnotte
  au bénéficiaire désigné par le contrat.
  Le tour suivant commence automatiquement.
</p></Panel><Panel title="Règles de rotation" subtitle="Principes de la tontine"><div className="steps"><div><span>01</span><p>Les membres rejoignent le groupe.</p></div><div><span>02</span><p>Chaque participant verse sa cotisation.</p></div><div><span>03</span><p>Un bénéficiaire reçoit la cagnotte selon les règles du contrat.</p></div></div></Panel></div>}
 {page === 'turns' && (
<Panel
  title="Gestion de la tontine"
subtitle="Inscriptions, cotisations et distribution"
>
  <div className="detail-line">
    <span>Tour actuel</span>
    <b>{data.tour ?? '—'}</b>
  </div>

  <div className="detail-line">
  <span>Participants inscrits</span>
  <b>{data.members ?? '—'}</b>
</div>

  <div className="detail-line">
    <span>État du tour</span>
    <b>
      {data.tourEnCours === null
        ? 'Indisponible'
        : data.tourEnCours
          ? 'En cours'
          : 'En attente'}
    </b>
  </div>

 <button
  type="button"
  className="secondary-button"
  onClick={lancerUnTour}
  disabled={
    !wallet ||
    !data.organizer ||
    wallet.toLowerCase() !== data.organizer.toLowerCase() ||
    data.inscriptionsFermees !== false ||
    data.cycleTermine !== false ||
    data.members == null ||
    Number(data.members) < 2 ||
    demarrageEnCours
  }
>
  <ArrowLeftRight size={17} />
  {demarrageEnCours
    ? 'Fermeture en cours...'
    : 'Fermer les inscriptions'}
</button>
  
<div style={{ marginTop: '15px' }}>
  <div className="detail-line">
    <span>Cotisations reçues</span>
    <b>{data.nombreCotisationsTour ?? '—'}</b>
  </div>

  <div className="detail-line">
    <span>Cotisations attendues</span>
    <b>{data.nombreCotisationsAttendues ?? '—'}</b>
  </div>

  <button
    type="button"
    className="secondary-button"
    onClick={envoyerCagnotte}
    
disabled={
  !wallet ||
  !data.organizer ||
  wallet.toLowerCase() !== data.organizer.toLowerCase() ||
  data.inscriptionsFermees !== true ||
  data.cycleTermine !== false ||
  data.nombreCotisationsTour === null ||
  data.members === null ||
  Number(data.members) < 2 ||
  Number(data.nombreCotisationsTour) !== Number(data.members) ||
  distributionEnCours
}

  >
    <Wallet size={17} />
    {distributionEnCours
      ? 'Distribution en cours...'
      : 'Distribuer la cagnotte'}
  </button>
</div>

</Panel>
)}

 {page==='history'&&<Panel title="Transactions sur Sepolia" subtitle="Consultez les événements réels sur l'explorateur public"><div className="tx-grid">{Object.entries(CONTRACTS).map(([key,address])=><div className="tx-card" key={key}><div className="stat-icon purple"><History size={20}/></div><b>{key==='mockUSD'?'Jeton MockUSD':key==='likelemba'?'Likelemba':'Caisse Likelemba'}</b><span>{short(address)}</span><a href={`${EXPLORER}/address/${address}#events`} target="_blank" rel="noopener noreferrer">Voir les transactions <ExternalLink size={14}/></a></div>)}</div><div className="info-note"><Info size={18}/><p>Les événements ne sont pas inventés : Etherscan affiche les transactions réellement enregistrées sur Sepolia. Un historique intégré sera possible avec les ABI et les événements Solidity exacts.</p></div></Panel>}
 {page==='settings'&&<><Panel title="Contrats intelligents" subtitle="Adresses configurées sur le réseau Sepolia"><div className="contract-list">{Object.entries(CONTRACTS).map(([key,address])=><div className="contract-row" key={key}><div><b>{key==='mockUSD'?'MockUSD (jeton)':key==='likelemba'?'Likelemba (membres)':'CaisseLikelemba (cotisations)'}</b><span>{address}</span></div><div className="contract-actions"><Status yes={data.deployed[key]}/><CopyButton value={address}/><Explorer address={address}>Etherscan</Explorer></div></div>)}</div></Panel><div className="two-col settings-bottom"><Panel title="Réseau MetaMask" subtitle="Ethereum Sepolia · Chain ID 11155111"><button className="secondary-button" onClick={async()=>{try{await switchToSepolia();setError('Réseau Sepolia sélectionné. Connecte maintenant ton portefeuille.')}catch(e){setError(e.message)}}}><Globe2 size={17}/> Basculer sur Sepolia</button></Panel><Panel title="Actualisation" subtitle="Données directement depuis la blockchain"><p className="panel-copy">Dernière lecture : {lastUpdate?lastUpdate.toLocaleTimeString('fr-FR'):'Non effectuée'}</p><button className="secondary-button" onClick={()=>refresh()}><RefreshCw size={16}/> Relire les contrats</button></Panel></div></>}
 <footer><span>© 2026 Likelemba · Application de démonstration académique</span><span>Sepolia Testnet · Aucun fonds réel</span></footer></div></main></div>
}
