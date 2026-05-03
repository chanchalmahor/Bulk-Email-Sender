"""
Bulk Email Sender — Chanchal Mahor (Job Application)
======================================================
Sends personalized job application emails with resume attachment
to HR contacts from the CompanyWise HR contact list.

Setup:
    1. Set SMTP_PASSWORD below (Gmail App Password)
       Get it at: https://myaccount.google.com/apppasswords
    2. Place your resume PDF in the SAME folder as this script
    3. Set DRY_RUN = False when ready to actually send
    4. Run: python bulk_email_sender.py
"""

import smtplib
import time
import logging
import csv
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dataclasses import dataclass
from typing import Optional

# ─────────────────────────────────────────────
# ✏️  YOUR DETAILS
# ─────────────────────────────────────────────

SENDER_NAME   = "Chanchal Mahor"
SENDER_EMAIL  = "chanchal01232@gmail.com"
SMTP_PASSWORD = "g---------"   # ← Replace with Gmail App Password

RESUME_PATH   = "Jr. Data Analyst Chanchal Mahor.pdf"  # Must be in same folder

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587

# ─────────────────────────────────────────────
# 📧  EMAIL CONTENT
# ─────────────────────────────────────────────

EMAIL_SUBJECT = "Application for Data Analyst Role | Chanchal Mahor"

EMAIL_BODY_TEMPLATE = """\
Dear {name},

I hope this email finds you well. I am writing to apply for the Data Analyst \
position at {company}.

I am a final-year B.Tech Computer Science Engineering student (graduating in 2026) \
with hands-on experience in data analysis, visualization, and reporting.

I have worked as a Data Analyst and Research Intern, where I used SQL, Python, \
Excel, and Power BI to clean, analyze, and visualize data, build dashboards, and \
extract actionable insights to support decision-making. I have also developed \
multiple real-world projects involving large datasets, KPI tracking, and \
interactive dashboards.

I am highly motivated, detail-oriented, and passionate about transforming raw \
data into meaningful insights. I am eager to contribute my analytical skills \
while continuing to learn and grow in a professional environment.

Please find my resume attached for your review. I would welcome the opportunity \
to discuss how my skills align with your team's requirements at {company}.

Thank you for your time and consideration.

Warm regards,
Chanchal Mahor
Data Analyst | Final-Year B.Tech CSE Student
chanchal01232@gmail.com
+91-7302194314
LinkedIn: https://www.linkedin.com/in/chanchalmahor/
GitHub: https://github.com/chanchalmahor/
"""

# ─────────────────────────────────────────────
# ⚙️  SETTINGS
# ─────────────────────────────────────────────

DELAY_BETWEEN_EMAILS = 3      # seconds between sends (reduces spam risk)
MAX_EMAILS_PER_RUN   = None   # e.g. 50 to send in batches; None = all
DRY_RUN              = False   # ✅ Set to False when ready to actually send
LOG_FILE             = "email_log.csv"

# ─────────────────────────────────────────────
# 👥  HR CONTACTS
# ─────────────────────────────────────────────

HR_CONTACTS = [
    {"name": "Akanksha Puri", "email": "akanksha.puri@sourcefuse.com", "company": "SourceFuse Technologies"},
    {"name": "Akanksha Sogani", "email": "akanksha.sogani@perennialsys.com", "company": "Perennial Systems"},
    {"name": "Akhil Jogiparthi", "email": "akhil@ibhubs.co", "company": "iB Hubs"},
    {"name": "Akhila Chandan", "email": "akhila@estuate.com", "company": "Estuate"},
    {"name": "Akram Mohammad", "email": "akram.mohammad@colruytgroup.com", "company": "Colruyt India"},
    {"name": "Akriti", "email": "akriti@elsner.in", "company": "Elsner Technologies"},
    {"name": "Akshata Bhandare", "email": "akshata.bhandare@windmill.ch", "company": "Windmill"},
    {"name": "Albino Mascarenhas", "email": "albino@pixis.ai", "company": "Pyxis One"},
    {"name": "Allwyn Richard", "email": "allwyn.r@qbrainx.com", "company": "QBrainX Inc"},
    {"name": "Alok Baghel", "email": "alok.singh@recro.io", "company": "Recro"},
    {"name": "Aman Khan", "email": "aman.khan@areteanstech.com", "company": "Areteans"},
    {"name": "Amar Sinha", "email": "amar.sinha@nitorinfotech.com", "company": "Nitor Infotech"},
    {"name": "Ambrish Kanungo", "email": "ambrish.kanungo@beyondkey.com", "company": "Beyond Key"},
    {"name": "Amiit Avaasthi", "email": "amiit.avaasthi@altudo.co", "company": "Altudo"},
    {"name": "Amit Kataria", "email": "amit@hanu.com", "company": "Hanu Software"},
    {"name": "Amit Prayagi", "email": "amit.prayagi@claimgenius.com", "company": "Claim Genius"},
    {"name": "Amita Shital", "email": "ashital@svam.com", "company": "SVAM International"},
    {"name": "Amrita Cheema", "email": "amrita.cheema@loconav.com", "company": "LocoNav"},
    {"name": "Amrita Singh", "email": "amrita.singh@cogentinfo.com", "company": "COGENT Infotech"},
    {"name": "Amritesh Shukla", "email": "amritesh.shukla@mygate.com", "company": "MyGate"},
    {"name": "Anand Christopher", "email": "anand.christopher@grassrootsbpo.com", "company": "Grassroots"},
    {"name": "Anand E", "email": "anand.e@increff.com", "company": "Increff"},
    {"name": "Anand Khot", "email": "anandk@pharmarack.com", "company": "Pharmarack"},
    {"name": "Anand Sasidharan", "email": "anand@hubilo.com", "company": "Hubilo"},
    {"name": "Anil Chandra", "email": "anil.chandra@thoughtspot.com", "company": "ThoughtSpot"},
    {"name": "Anil Pereira", "email": "anil.pereira@visiblealpha.com", "company": "Visible Alpha"},
    {"name": "Animesh Kumar", "email": "animesh.kumar@novopay.in", "company": "Novopay"},
    {"name": "Anindita Ranjan", "email": "anindita.ranjan@3ds.com", "company": "Dassault Systems"},
    {"name": "Anirban Chakravorty", "email": "anirban.chakravorty@nttdata.com", "company": "NTT DATA"},
    {"name": "Anish Ahmed", "email": "anish.ahmed@vaave.com", "company": "Vaave"},
    {"name": "Anita Noronha", "email": "anoronha@shorewise.com", "company": "ShoreWise Consulting"},
    {"name": "Anjali Patil", "email": "anjali.patil@workindia.in", "company": "WorkIndia"},
    {"name": "Anjali Sharma", "email": "anjali.sharma@fulcrumdigital.com", "company": "Fulcrum Digital Inc"},
    {"name": "Ankit Tomar", "email": "ankit.tomar@rategain.com", "company": "RateGain"},
    {"name": "Ankita Sinha", "email": "ankita.sinha@mtxb2b.com", "company": "MTX Group"},
    {"name": "Anna Andrews", "email": "annaa@smartek21.com", "company": "SmarTek21"},
    {"name": "Anoob Abraham", "email": "anoob.abraham@arcadia.com", "company": "Arcadia"},
    {"name": "Anshika Khaitan", "email": "anshika.khaitan@getvymo.com", "company": "Vymo"},
    {"name": "Anshu Anand", "email": "anshu.anand@absolutdata.com", "company": "Absolutdata Analytics"},
    {"name": "Anuj Agarwal", "email": "anuj@deskera.com", "company": "Deskera"},
    {"name": "Anupam Jauhari", "email": "anupam.j@gsl.in", "company": "Ginesys"},
    {"name": "Anupam Srivastava", "email": "anupam.srivastava@reltio.com", "company": "Reltio"},
    {"name": "Anurag Rana", "email": "anurag.rana@sirionlabs.com", "company": "SirionLabs"},
    {"name": "Anurag Verma", "email": "anurag@uniphore.com", "company": "Uniphore"},
    {"name": "Aparna Gunjikar", "email": "aparna.gunjikar@softnautics.com", "company": "Softnautics"},
    {"name": "Aradhana Gupta", "email": "aradhana@safexpay.com", "company": "SafexPay"},
    {"name": "Aravind Warrier", "email": "aravind.warrier@rapidvaluesolutions.com", "company": "RapidValue"},
    {"name": "Archana Anand", "email": "archana@aufait.in", "company": "Aufait Technologies"},
    {"name": "Archana Manne", "email": "archana.manne@locuz.com", "company": "Locuz"},
    {"name": "Ashish Naidu", "email": "ashish.naidu@mindgate.in", "company": "Mindgate Solutions"},
    {"name": "Ashok Tripathy", "email": "ashok.tripathy@bpoconvergence.com", "company": "BPO Convergence"},
    {"name": "Ashwani Kumar", "email": "ashwani@successive.tech", "company": "Successive Technologies"},
    {"name": "Aswanth Goka", "email": "agoka@workfusion.com", "company": "WorkFusion"},
    {"name": "Atin Karmokar", "email": "atin.karmokar@pentagon.co.in", "company": "Pentagon System and Services"},
    {"name": "Avinash Poojari", "email": "avinash@sedintechnologies.com", "company": "Sedin Technologies"},
    {"name": "Babitha Nambiar", "email": "babitha.nambiar@opusconsulting.com", "company": "Opus Consulting Solutions"},
    {"name": "Balaji Thiyagarajan", "email": "balaji.thiyagarajan@thirdware.com", "company": "Thirdware Solution INC"},
    {"name": "Balakrishna Shetty", "email": "balakrishna.shetty@genisys-group.com", "company": "Genisys Group"},
    {"name": "Balneet Birah", "email": "balneet.birah@netsolutions.com", "company": "Net Solutions"},
    {"name": "Barkha Agrawal", "email": "bagrawal@cpg-inc.com", "company": "Computer Power Group"},
    {"name": "Barkha Sharma", "email": "barkha@wobot.ai", "company": "Wobot.ai"},
    {"name": "Bedisha Karmakar", "email": "bedisha@reward360.co", "company": "Reward360 Global Services"},
    {"name": "Bensely Zachariah", "email": "bensely.zachariah@fulcrumdigital.com", "company": "Fulcrum Digital Inc"},
    {"name": "Bhakti Dharod", "email": "bhakti.dharod@idfy.com", "company": "IDfy"},
    {"name": "Bharat Bhartia", "email": "bharat.bhartia@workindia.in", "company": "WorkIndia"},
    {"name": "Bharti Negi", "email": "bharti.negi@edifecs.com", "company": "Edifecs"},
    {"name": "Bhavana Jain", "email": "bhavana@netcore.co.in", "company": "Netcore Cloud"},
    {"name": "Bhavya Shetty", "email": "bhavya@supplywisdom.com", "company": "Supply Wisdom"},
    {"name": "Bikram Dash", "email": "bikram.dash@tatwa.info", "company": "TATWA Technologies"},
    {"name": "Bindu Krishnan", "email": "bindu.krishnan@ospyn.com", "company": "Ospyn Technologies"},
    {"name": "Britto Ambrose", "email": "britto@xoxoday.com", "company": "Xoxoday"},
    {"name": "Byju Valappil", "email": "byju@rdalabs.com", "company": "RDAlabs"},
    {"name": "Celina Joseph", "email": "celina.joseph@extentia.com", "company": "Extentia Information Technology"},
    {"name": "Chaitali Bhattacharya", "email": "cbhattacharya@inventive-it.com", "company": "Inventive IT"},
    {"name": "Chaitanya Peeta", "email": "chaitanya.peeta@polygon.technology", "company": "Polygon"},
    {"name": "Chandini Davies", "email": "chandinid@saglobal.com", "company": "sa.global"},
    {"name": "Chandni Chopra", "email": "chandnic@lambdatest.com", "company": "LambdaTest"},
    {"name": "Chetna Gogia", "email": "chetna@gokwik.co", "company": "GoKwik"},
    {"name": "Chhavi Bhatnagar", "email": "chhavi.bhatnagar@acnovate.com", "company": "Acnovate Corporation"},
    {"name": "Deepa Mukherjee", "email": "deepa.mukherjee@esri.in", "company": "Esri India"},
    {"name": "Deepak Khanna", "email": "dkhanna@ishir.com", "company": "ISHIR"},
    {"name": "Deepika Pandita", "email": "deepika@appinessworld.com", "company": "Appiness Interactive"},
    {"name": "Deepika Singh", "email": "deepika@webkul.com", "company": "Webkul"},
    {"name": "Diksha Rohokale", "email": "diksha@apptware.com", "company": "Apptware"},
    {"name": "Dilip Satpute", "email": "dilip.s@theimperative.in", "company": "Imperative Business Ventures"},
    {"name": "Divya Chandrasekhara", "email": "divya.chandrasekhara@infoworks.io", "company": "Infoworks.io"},
    {"name": "Divya Gunashekar", "email": "divya@thescalers.com", "company": "The Scalers"},
    {"name": "Divya Jaggi", "email": "divyajaggi@promactinfo.com", "company": "Promact Infotech"},
    {"name": "Donna Ellies", "email": "donna.ellies@br.iq", "company": "Briq"},
    {"name": "Ekta Kohli", "email": "ekta.kohli@simulationiq.com", "company": "Education Management Solutions"},
    {"name": "Firdaus Mehta", "email": "firdaus.mehta@heliossolutions.co", "company": "Helios Solutions"},
    {"name": "Francis Gonsalves", "email": "francis.gonsalves@moengage.com", "company": "MoEngage"},
    {"name": "Gargi Rajan", "email": "gargi.rajan@unicommerce.com", "company": "Unicommerce eSolutions"},
    {"name": "Garima Sangwan", "email": "garima.sangwan@accops.com", "company": "Accops Systems"},
    {"name": "Garima Sharma", "email": "gsharma@nasscom.in", "company": "NASSCOM"},
    {"name": "Gautam Kar", "email": "gautam@firstconnectsolutions.com", "company": "FirstConnect Solutions"},
    {"name": "Gayathri Nagaraj", "email": "gayathri.nagaraj@responsivemts.com", "company": "Responsive Media Tech Services"},
    {"name": "Gayatri Shanker", "email": "gayatri@dyooti.com", "company": "Dyooti"},
    {"name": "Geetanjali Toopran", "email": "geetanjali.toopran@solix.com", "company": "Solix Technologies"},
    {"name": "Heena Bawa", "email": "heena@clevertap.com", "company": "CleverTap"},
    {"name": "Hemraj Desai", "email": "hemraj@cloudthat.in", "company": "CloudThat"},
    {"name": "Himanshu Raina", "email": "himanshu@ditserv.com", "company": "DEV IT SERV"},
    {"name": "Hitendra Singh", "email": "hsingh@hitachi-solutions.com", "company": "Hitachi Solutions India"},
    {"name": "Honeydeep Sabharwal", "email": "honeydeep@pando.ai", "company": "PandoCorp"},
    {"name": "Humera Iffath", "email": "humera.iffath@truecaller.com", "company": "Truecaller"},
    {"name": "Jabeen Pathan", "email": "jabeen@hulkapps.com", "company": "HulkApps"},
    {"name": "Janet Paul", "email": "jpaul@securonix.com", "company": "Securonix"},
    {"name": "Jasmine Vaswani", "email": "jasmine.vaswani@worldfashionexchange.co", "company": "WFX - World Fashion Exchange"},
    {"name": "Jayashree Jayanth", "email": "jayashree.jayanth@ushur.com", "company": "Ushur"},
    {"name": "Jayati Pardhy", "email": "jayati.p@keka.com", "company": "Keka HR"},
    {"name": "Jitendra Das", "email": "jitendra.das@workinsync.io", "company": "WorkInSync"},
    {"name": "Juhi Sharma", "email": "juhi.sharma@lockstep.io", "company": "Lockstep"},
    {"name": "Justin Joseph", "email": "justin@near.com", "company": "Near"},
    {"name": "Jyoti Gouri", "email": "jyoti.g@commerceiq.ai", "company": "CommerceIQ"},
    {"name": "Jyoti Singh", "email": "jyoti.singh@zapcg.com", "company": "ZapCom Group Inc"},
    {"name": "Kajal Gupta", "email": "hr@dhaninfo.biz", "company": "DhanInfo"},
    {"name": "Kalpana Kanhere", "email": "kalpana@theimperative.in", "company": "Imperative Business Ventures"},
    {"name": "Kavita Tandon", "email": "kavita.tandon@simplifyhealthcare.com", "company": "Simplify Healthcare"},
    {"name": "Kavitha Umasankar", "email": "kavitha.umasankar@wolterskluwer.com", "company": "Wolters Kluwer ELM Solutions"},
    {"name": "Korak Saha", "email": "korak.saha@mjunction.in", "company": "mjunction services"},
    {"name": "Lavita Nathani", "email": "lavita.n@endurance.com", "company": "Newfold Digital"},
    {"name": "Livin Varghese", "email": "livin.varghese@teqfocus.com", "company": "Teqfocus"},
    {"name": "Lyndon Saldanha", "email": "lyndon.saldanha@manthan.com", "company": "Manthan"},
    {"name": "Manasi Kelkar", "email": "manasi.kelkar@cropin.com", "company": "CropIn Technology"},
    {"name": "Manav Jain", "email": "manav.jain@loconav.com", "company": "LocoNav"},
    {"name": "Manisha Dash", "email": "manisha.dash@celigo.com", "company": "Celigo"},
    {"name": "Manash Chakraborty", "email": "mchakraborty@phdata.io", "company": "phData"},
    {"name": "Maya John", "email": "maya.john@verse.in", "company": "VerSe Innovation"},
    {"name": "Meena R", "email": "meena@airmeet.com", "company": "Airmeet"},
    {"name": "Meenakshi Banerjee", "email": "meenakshi.banerjee@crmnext.in", "company": "CRMNEXT"},
    {"name": "Mohammed Hussain", "email": "mohammed@uniphore.com", "company": "Uniphore"},
    {"name": "Monika Koul", "email": "monika@embitel.com", "company": "Embitel Technologies"},
    {"name": "Nandakishore Padmanabhan", "email": "nandakishore.padmanabhan@crmnext.com", "company": "CRMNEXT"},
    {"name": "Naveen Pillai", "email": "naveen@crayondata.com", "company": "Crayon Data"},
    {"name": "Neha Bhise", "email": "nbhise@tracelink.com", "company": "TraceLink"},
    {"name": "Niharika Patel", "email": "niharika.patel@jetsynthesys.com", "company": "JetSynthesys"},
    {"name": "Nimesh Mathur", "email": "nimesh@haptik.ai", "company": "Haptik"},
    {"name": "Nishant Shukla", "email": "nishant.shukla@hoonartek.com", "company": "Hoonartek"},
    {"name": "Nitin Nahata", "email": "nitin.nahata@gameskraft.com", "company": "Gameskraft"},
    {"name": "Nupur Jain", "email": "nupur@ixigo.com", "company": "ixigo"},
    {"name": "Pankaj Chopra", "email": "pankaj.chopra@corecard.com", "company": "CoreCard India"},
    {"name": "Pardeep Pahal", "email": "pardeepp@damcogroup.com", "company": "Damco Solutions"},
    {"name": "Pavithradesai Pd", "email": "pavithra.desai@infracloud.io", "company": "InfraCloud Technologies"},
    {"name": "Pooja Madappa", "email": "pooja.madappa@netradyne.com", "company": "Netradyne"},
    {"name": "Poornima Gowda", "email": "poornima.gowda@fortanix.com", "company": "Fortanix"},
    {"name": "Preetham Singh", "email": "preetham.singh@tanla.com", "company": "Tanla Platforms"},
    {"name": "Priyanka Sharma", "email": "priyanka.s@decimaltech.com", "company": "Decimal Technologies"},
    {"name": "Rajeev Bhardwaj", "email": "rajeev.bhardwaj@sunlife.com", "company": "Sun Life"},
    {"name": "Rajesh Yadav", "email": "rajesh.yadav@gstn.org.in", "company": "Goods And Services Tax Network"},
    {"name": "Rakesh Arora", "email": "rakesh.arora@skilrock.com", "company": "Skilrock Technologies"},
    {"name": "Ramesh Mantana", "email": "rmantana@evoketechnologies.com", "company": "Evoke Technologies"},
    {"name": "Rashmi George", "email": "rashmi.george@niveussolutions.com", "company": "Niveus Solutions"},
    {"name": "Ravi Gurunathan", "email": "ravi.gurunathan@ivalue.co.in", "company": "iValue InfoSolutions"},
    {"name": "Ravindra Dandekar", "email": "ravindra.dandekar@myglamm.com", "company": "MyGlamm"},
    {"name": "Rekha Nair", "email": "rekha.nair@navis.com", "company": "Navis"},
    {"name": "Richa Pande", "email": "richa.pande@inatech.com", "company": "Inatech"},
    {"name": "Rima Das", "email": "rima@maropost.com", "company": "Maropost"},
    {"name": "Rinki Goel", "email": "rinki.goel@hevodata.com", "company": "Hevo Data"},
    {"name": "Roopa Gangadharan", "email": "roopa.g@aujas.com", "company": "Aujas Cybersecurity"},
    {"name": "Roystone Fernandez", "email": "roystone@accubits.com", "company": "Accubits Technologies"},
    {"name": "Ruchika Sawhney", "email": "ruchika.sawhney@cometchat.com", "company": "CometChat"},
    {"name": "Rupali Veerkar", "email": "rupali.veerkar@bitwiseglobal.com", "company": "Bitwise India"},
    {"name": "Sabina Juvekar", "email": "sabina.juvekar@cloudaction.com", "company": "Cloudaction"},
    {"name": "Sachin Girolla", "email": "sachin.girolla@triarqhealth.com", "company": "TRIARQ Health India"},
    {"name": "Sahil Sharma", "email": "sahil.sharma@rategain.com", "company": "RateGain"},
    {"name": "Samir Dhond", "email": "samir.dhond@ittiam.com", "company": "Ittiam Systems"},
    {"name": "Sanjay Chandel", "email": "sanjay.chandel@joveo.com", "company": "Joveo"},
    {"name": "Sanjeev Dhokte", "email": "sanjeev.dhokte@accops.com", "company": "Accops Systems"},
    {"name": "Sarada Kandanur", "email": "sarada.kandanur@kore.com", "company": "Kore.ai"},
    {"name": "Sathish Kumar", "email": "sathish.kumar@valgenesis.com", "company": "ValGenesis"},
    {"name": "Saurabh Jadhav", "email": "saurabh.jadhav@sumerusolutions.com", "company": "SUMERU SOFTWARE SOLUTIONS"},
    {"name": "Seema Natarajan", "email": "seema@heptagon.in", "company": "Heptagon Technologies"},
    {"name": "Shaheen Malim", "email": "shaheen@prodevans.com", "company": "Prodevans Technologies"},
    {"name": "Shail Parashar", "email": "shail.parashar@testingxperts.com", "company": "TestingXperts"},
    {"name": "Shailesh Jadhav", "email": "shailesh@mirafra.com", "company": "Mirafra Technologies"},
    {"name": "Sharad Srivastava", "email": "sharad.srivastava@blumeglobal.com", "company": "Blume Global"},
    {"name": "Shavee Sehajpal", "email": "shavee.s@algonomy.com", "company": "Algonomy"},
    {"name": "Sheetal Pote", "email": "sheetal.pote@saviantconsulting.com", "company": "Saviant Consulting"},
    {"name": "Shipra Pandit", "email": "shipra.pandit@juspay.in", "company": "JUSPAY"},
    {"name": "Shipra Rai", "email": "shipra.rai@niveussolutions.com", "company": "Niveus Solutions"},
    {"name": "Shivani Chaturvedi", "email": "shivani.chaturvedi@mjunction.in", "company": "mjunction services"},
    {"name": "Shivani Jaiswal", "email": "shivani@virtualheight.com", "company": "Virtual Height IT Services"},
    {"name": "Shobana Kailash", "email": "shobana@hubilo.com", "company": "Hubilo"},
    {"name": "Shreeja Santosh", "email": "shreeja.santosh@lrn.com", "company": "LRN"},
    {"name": "Shruti Gandhi", "email": "shruti.gandhi@moolya.com", "company": "Moolya"},
    {"name": "Shubha Menon", "email": "shubham@kastechssg.com", "company": "Kastech Software Solutions Group"},
    {"name": "Shubham Katiyar", "email": "shubhamkatiyar@ameyo.com", "company": "Ameyo"},
    {"name": "Smitha Sajo", "email": "smitha.sajo@applexus.com", "company": "Applexus Technologies"},
    {"name": "Snigdha Prashar", "email": "snigdha@saavn.com", "company": "JioSaavn"},
    {"name": "Sophronia Kasab", "email": "sophronia@reshamandi.com", "company": "ReshaMandi"},
    {"name": "Soundarya Murugaiyan", "email": "soundarya.murugaiyan@cts.co", "company": "CTS"},
    {"name": "Srividhya Deshpande", "email": "srividhya.deshpande@springml.com", "company": "SpringML"},
    {"name": "Sumit Kathuria", "email": "sumit.k@nrconsultingservice.com", "company": "NR Consulting"},
    {"name": "Supriya A", "email": "supriya.a@ecolabdigitalcenter.in", "company": "Ecolab Digital Center"},
    {"name": "Surabhi Sharma", "email": "surabhi.sharma@se2.com", "company": "SE2"},
    {"name": "Swapna Jaladi", "email": "swapna.jaladi@savantis.com", "company": "Savantis Solutions LLC"},
    {"name": "Swapnika Nag", "email": "snag@tataunistore.com", "company": "Tata CLiQ"},
    {"name": "Sweety Rath", "email": "sweety.rath@aspect.com", "company": "Alvaria"},
    {"name": "Tanisha T", "email": "tanisha@91social.com", "company": "91social"},
    {"name": "Tapas Chatterjee", "email": "tapas@spartanpoker.com", "company": "QUADRIFIC MEDIA"},
    {"name": "Tisha Prasad", "email": "tisha@loconav.com", "company": "LocoNav"},
    {"name": "Tulasi Pochampally", "email": "tpochampally@hostanalytics.com", "company": "Planful"},
    {"name": "Umesh Kamath", "email": "umesh.kamath@maxval.com", "company": "MaxVal Group"},
    {"name": "Usha Nath", "email": "usha.nath@nathcorp.com", "company": "NathCorp"},
    {"name": "Vaibhav", "email": "vaibhav.khanna@fci-ccm.com", "company": "FCI CCM"},
    {"name": "Vandana Roy", "email": "vandana.roy@vfirst.com", "company": "ValueFirst"},
    {"name": "Vara Tupalli", "email": "vara.tupalli@amnetdigital.com", "company": "Amnet Digital"},
    {"name": "Varun Wadhwa", "email": "varun.wadhwa@birdeye.com", "company": "Birdeye"},
    {"name": "Vedha Bharathi", "email": "vedha@cloudthing.com", "company": "cloudThing"},
    {"name": "Veena Satish", "email": "veena.satish@moengage.com", "company": "MoEngage"},
    {"name": "Venkata Kuruhuri", "email": "venkata.kuruhuri@symphonycorp.com", "company": "Symphony Corporation"},
    {"name": "Vikrant Goyal", "email": "vikrant.goyal@games24x7.com", "company": "Games24x7"},
    {"name": "Vishwa Kapadia", "email": "vishwa@platform9.com", "company": "Platform9 Systems"},
    {"name": "Vishwanath Belliappa", "email": "vishwanath.belliappa@codecraft.co.in", "company": "CodeCraft Technologies"},
    {"name": "Vivek Gaur", "email": "vivek@pacificbpo.com", "company": "Pacific Global"},
    {"name": "Yashika Thimmaiah", "email": "yashika@vrize.com", "company": "VRIZE"},
    {"name": "Yogita Sharma", "email": "yogita.sharma@netsmartz.com", "company": "Netsmartz"},
    {"name": "Zarna Trivedi", "email": "zarnatrivedi@versa-networks.com", "company": "Versa Networks"},
    {"name": "Zia Alam", "email": "zia.alam@bluepineapple.io", "company": "bluepineapple"},
    {"name": "Zubair Wani", "email": "zubair.wani@netmagicsolutions.com", "company": "NTT DATA"},
    {"name": "Zulfiqar Syed", "email": "zulfiqar.syed@netcore.co.in", "company": "Netcore Cloud"},
]


# ─────────────────────────────────────────────
# ⚙️  CORE LOGIC — no edits needed below
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@dataclass
class EmailResult:
    name: str
    email: str
    company: str
    status: str
    error: Optional[str] = None


def load_resume(path: str) -> bytes:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"\n❌ Resume not found: '{path}'\n"
            f"   Make sure the PDF is in the same folder as this script."
        )
    with open(path, "rb") as f:
        return f.read()


def build_message(contact: dict, resume_bytes: bytes) -> MIMEMultipart:
    msg = MIMEMultipart()
    msg["From"]    = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"]      = contact["email"]
    msg["Subject"] = EMAIL_SUBJECT

    body = EMAIL_BODY_TEMPLATE.format(**contact)
    msg.attach(MIMEText(body, "plain"))

    # Attach resume
    part = MIMEBase("application", "octet-stream")
    part.set_payload(resume_bytes)
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="{os.path.basename(RESUME_PATH)}"',
    )
    msg.attach(part)
    return msg


def send_bulk_emails():
    resume_bytes = load_resume(RESUME_PATH)
    logger.info(f"✅ Resume loaded ({len(resume_bytes) // 1024} KB): {RESUME_PATH}")

    contacts = HR_CONTACTS[:MAX_EMAILS_PER_RUN] if MAX_EMAILS_PER_RUN else HR_CONTACTS
    mode_tag = "[DRY RUN] " if DRY_RUN else ""
    logger.info(f"{mode_tag}Preparing to send to {len(contacts)} contacts...")

    smtp_conn = None
    if not DRY_RUN:
        try:
            smtp_conn = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            smtp_conn.ehlo()
            smtp_conn.starttls()
            smtp_conn.login(SENDER_EMAIL, SMTP_PASSWORD)
            logger.info("✅ SMTP authenticated successfully.")
        except Exception as e:
            logger.error(f"❌ SMTP failed: {e}")
            return

    results, sent, skipped, failed = [], 0, 0, 0

    for i, contact in enumerate(contacts, 1):
        name  = contact.get("name", "")
        email = contact.get("email", "").strip()
        co    = contact.get("company", "")

        if not email or "@" not in email:
            logger.warning(f"[{i}/{len(contacts)}] Skipping {name} — bad email")
            results.append(EmailResult(name, email, co, "skipped", "Invalid email"))
            skipped += 1
            continue

        try:
            msg = build_message(contact, resume_bytes)
            if DRY_RUN:
                logger.info(f"[DRY RUN] [{i}/{len(contacts)}] → {name} <{email}> @ {co}")
            else:
                smtp_conn.sendmail(SENDER_EMAIL, email, msg.as_string())
                logger.info(f"[{i}/{len(contacts)}] ✅ Sent → {name} <{email}> @ {co}")
                time.sleep(DELAY_BETWEEN_EMAILS)
            results.append(EmailResult(name, email, co, "sent"))
            sent += 1
        except Exception as e:
            logger.error(f"[{i}/{len(contacts)}] ❌ {name} <{email}>: {e}")
            results.append(EmailResult(name, email, co, "failed", str(e)))
            failed += 1

    if smtp_conn:
        smtp_conn.quit()

    with open(LOG_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "email", "company", "status", "error"])
        writer.writeheader()
        for r in results:
            writer.writerow({"name": r.name, "email": r.email, "company": r.company,
                             "status": r.status, "error": r.error or ""})

    print(f"""
{'='*55}
  {mode_tag}EMAIL CAMPAIGN SUMMARY
{'='*55}
  ✅ Sent       : {sent}
  ⏭️  Skipped    : {skipped}
  ❌ Failed     : {failed}
  📎 Attachment : {os.path.basename(RESUME_PATH)}
  📄 Log saved  : {LOG_FILE}
{'='*55}""")


if __name__ == "__main__":
    send_bulk_emails()