import React from "react";

export type Level = { name: string; minPoints: number; color: string };
export const LEVELS: Level[] = [
  { name: "Mews Professor", minPoints: 800, color: "text-purple-500" },
  { name: "Timeline Wizard", minPoints: 500, color: "text-blue-500" },
  { name: "Overbooking Survivor", minPoints: 250, color: "text-green-500" },
  { name: "Keycard Ninja", minPoints: 50, color: "text-orange-500" },
  { name: "PMS Newbie", minPoints: 0, color: "text-gray-500" },
];

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  content: React.ReactNode[];
  quiz: QuizQuestion[];
  points: number;
};

export const COURSES: Course[] = [
  {
    id: "perfect-checkin",
    title: "The Perfect Check-in",
    description:
      "Learn the standard Lichtburg check-in procedure, ensuring every guest feels welcome from the moment they arrive. Essential for all new staff.",
    duration: "15 mins",
    points: 100,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">1. The Golden First Impression</h3>
        <p className="text-lg leading-relaxed">
          The check-in process is the first direct, physical interaction our guests have with
          Lichtburg after what may have been a very long journey. Berlin is a busy, often
          overwhelming city for newcomers. Whether they are arriving from Tegel (if it were still
          open), BER, or Hauptbahnhof, our hostel must feel like a sanctuary immediately.
        </p>
        <p className="text-lg leading-relaxed">
          Always stand up when a guest approaches the desk. Body language matters immensely.
          Maintain an open posture, smile genuinely, and make eye contact. Your opening line should
          always be confident and warm: <i>"Welcome to Lichtburg, how can I help you today?"</i> Do
          not ask "Checking in?" as it assumes their intent and limits the interaction.
        </p>
        <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
          <h4 className="font-semibold text-primary mb-2">The "Water Glass" Rule</h4>
          <p className="text-muted-foreground leading-relaxed">
            If a guest arrives carrying heavy backpacks, looks visibly exhausted, or it is a
            particularly hot Berlin summer day, immediately offer them a glass of tap water before
            asking for their booking details. This small gesture instantly builds rapport and
            diffuses any travel anxiety.
          </p>
        </div>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">2. Verification, Registration & Payment</h3>
        <p className="text-lg leading-relaxed">
          Once the initial greeting is complete, proceed with the administrative tasks. In Germany,
          we are legally required to register every guest. Politely ask for their ID or passport:{" "}
          <i>"May I please have your ID or passport to locate your reservation?"</i>
          Verify the name against our PMS and confirm the details: the number of nights, the room
          type (e.g., a bed in a 6-bed dorm vs. a private double), and any special requests they
          made during booking.
        </p>
        <p className="text-lg leading-relaxed">
          If the guest has not prepaid, this is the time to handle the payment. Always mention the
          Berlin City Tax (5% of the net room rate) clearly, as guests are often surprised by it if
          they booked through a third-party OTA like Booking.com. Offer our payment terminal:{" "}
          <i>
            "Your total for the stay is €120, plus the Berlin City Tax of €6. How would you like to
            pay?"
          </i>
        </p>
      </div>,
      <div key="3" className="space-y-6">
        <h3 className="text-2xl font-bold">3. The Pitch: Welcome to the House</h3>
        <p className="text-lg leading-relaxed">
          Now that the paperwork is sorted, you must brief the guest on the house rules and
          amenities. Hand over the keycards in their designated sleeve.
          <b>Crucial Security Rule:</b> Never write the room number directly on the keycard. If the
          card is lost, anyone could find it and access the guest's room. Write it only on the
          sleeve.
        </p>
        <p className="text-lg leading-relaxed">
          Explain our core amenities clearly:
          <ul className="list-disc pl-8 space-y-2 mt-4 text-muted-foreground">
            <li>
              <b>Breakfast:</b> "Breakfast is served downstairs from 7:30 AM to 11:00 AM."
            </li>
            <li>
              <b>Wi-Fi:</b> "The Wi-Fi network is 'LichtburgGuest' and the password is on the back
              of your key sleeve."
            </li>
            <li>
              <b>Kitchen:</b> "Our communal kitchen is open 24/7, but please label your food in the
              fridge."
            </li>
            <li>
              <b>Events:</b> Mention any events happening tonight (e.g., Pub Crawl, Family Dinner).
            </li>
          </ul>
        </p>
        <p className="text-lg leading-relaxed mt-4">
          Finally, point them towards the elevators and wish them a wonderful stay. Use their name
          if you feel comfortable doing so.
        </p>
      </div>,
    ],
    quiz: [
      {
        question:
          "What is the recommended response if a guest arrives looking exhausted from the heat?",
        options: [
          "Tell them their room isn't ready",
          "Offer them a glass of water before starting paperwork",
          "Speed up the check-in process by skipping the pitch",
          "Ask them to sit in the lobby until they cool down",
        ],
        correctIndex: 1,
      },
      {
        question: "Why should you never write the room number directly on the plastic keycard?",
        options: [
          "It looks unprofessional and messy",
          "The ink ruins the magnetic strip or NFC chip",
          "For security reasons, in case the guest drops or loses the key",
          "We recycle the cards and it's hard to clean",
        ],
        correctIndex: 2,
      },
      {
        question: "Which of the following is a legal requirement in Germany during check-in?",
        options: [
          "Registering the guest with their ID or passport",
          "Offering a welcome drink",
          "Signing a waiver for hostel activities",
          "Paying entirely in cash",
        ],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "handling-complaints",
    title: "Handling Difficult Guests",
    description:
      "Master the art of de-escalation, conflict resolution, and turning a negative guest experience into a positive one using our proprietary framework.",
    duration: "20 mins",
    points: 150,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">The Nature of Hostel Complaints</h3>
        <p className="text-lg leading-relaxed">
          Hostels are dense living environments. When you pack dozens of strangers into dormitories,
          friction is inevitable. Guests will complain about noise, snoring roommates, unmade beds,
          broken amenities, or even each other. As a Front Office Agent, you are the first line of
          defense. You must absorb this friction and neutralize it.
        </p>
        <p className="text-lg leading-relaxed">
          Remember: when a guest is shouting or upset, it is rarely personal. They are frustrated by
          their circumstances. By maintaining a calm demeanor and a low voice, you can naturally
          bring their energy level down. Never match their raised voice.
        </p>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">The LEARN Method</h3>
        <p className="text-lg leading-relaxed">
          At Lichtburg, we use the <b>LEARN</b> method for complaint resolution:
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-card border rounded-lg">
            <h4 className="font-bold text-xl mb-1 text-primary">L - Listen</h4>
            <p className="text-muted-foreground">
              Let the guest speak without interrupting. Often, people just want to feel heard. Nod
              and maintain eye contact.
            </p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <h4 className="font-bold text-xl mb-1 text-primary">E - Empathize</h4>
            <p className="text-muted-foreground">
              Acknowledge their feelings. Say:{" "}
              <i>
                "I completely understand why you are frustrated. That sounds like a terrible way to
                start the night."
              </i>
            </p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <h4 className="font-bold text-xl mb-1 text-primary">A - Apologize</h4>
            <p className="text-muted-foreground">
              Apologize for the situation, even if it is not directly your fault.{" "}
              <i>"I am very sorry that you had to deal with this noise."</i>
            </p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <h4 className="font-bold text-xl mb-1 text-primary">R - Resolve</h4>
            <p className="text-muted-foreground">
              Offer immediate, actionable solutions. Give them choices if possible. (e.g., "I can
              move you to a quieter dorm down the hall, or I can provide earplugs and speak to the
              noisy guest.")
            </p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <h4 className="font-bold text-xl mb-1 text-primary">N - Notify</h4>
            <p className="text-muted-foreground">
              Log the incident in the PMS notes. If the issue is severe, notify the Duty Manager so
              they can follow up the next morning.
            </p>
          </div>
        </div>
      </div>,
    ],
    quiz: [
      {
        question: "What is the best way to respond if a guest raises their voice at you?",
        options: [
          "Raise your voice so they can hear you",
          "Tell them to calm down immediately",
          "Maintain a calm demeanor and speak in a low voice",
          "Walk away into the back office",
        ],
        correctIndex: 2,
      },
      {
        question: "What does the 'R' in the LEARN method stand for?",
        options: ["React", "Resolve", "Reimburse", "Record"],
        correctIndex: 1,
      },
      {
        question: "Why is it important to log the complaint in the PMS?",
        options: [
          "To punish the guest later",
          "To deduct pay from the responsible staff member",
          "So the Duty Manager is aware and the team has context for future interactions",
          "It is required by Berlin city law",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "berlin-tourism",
    title: "Berlin Tourism Basics",
    description:
      "Equip yourself with the essential knowledge every receptionist needs when guests ask 'What should I do today?'",
    duration: "25 mins",
    points: 200,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">The Must-Sees</h3>
        <p className="text-lg leading-relaxed">
          Every day, dozens of guests will approach the desk and ask for recommendations. While
          everyone's tastes differ, you must have a baseline knowledge of Berlin's core attractions
          and how to get there.
        </p>
        <p className="text-lg leading-relaxed">
          <b>Brandenburg Gate & Reichstag:</b> The classic historical duo. Remind guests that if
          they want to visit the Reichstag dome, they MUST book online several days in advance due
          to security protocols.
        </p>
        <p className="text-lg leading-relaxed">
          <b>East Side Gallery:</b> A 1.3km stretch of the Berlin Wall covered in murals. Easiest
          way there? Take the U-Bahn or S-Bahn to Warschauer Straße. Tell guests to walk along the
          river towards Ostbahnhof.
        </p>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">Public Transport Nuances</h3>
        <p className="text-lg leading-relaxed">
          Berlin's BVG is efficient but confusing for tourists. Always explain the zone system: AB
          covers almost everything a tourist wants to see. ABC is only necessary for the airport
          (BER) or Potsdam.
        </p>
        <p className="text-lg leading-relaxed text-destructive font-semibold">
          Crucial Warning: Validating Tickets!
        </p>
        <p className="text-lg leading-relaxed">
          One of the most common ways guests get a €60 fine is by buying a paper ticket and
          forgetting to stamp (validate) it before boarding the U-Bahn or S-Bahn. Always warn them
          to stamp the ticket in the red or yellow boxes on the platform!
        </p>
      </div>,
      <div key="3" className="space-y-6">
        <h3 className="text-2xl font-bold">Clubbing & Nightlife Advice</h3>
        <p className="text-lg leading-relaxed">
          Many guests come to Berlin specifically for the techno scene (Berghain, Tresor, Sisyphos).
          As a hostel agent, give them realistic advice to manage their expectations.
        </p>
        <ul className="list-disc pl-8 space-y-3 text-lg text-muted-foreground">
          <li>
            <b>Dress code:</b> Casual, dark, unpretentious. Leave the high heels and fancy shirts at
            home.
          </li>
          <li>
            <b>Behavior:</b> Be quiet in the queue. Do not use phones. Know who is playing that
            night.
          </li>
          <li>
            <b>Rejection:</b> Rejection is common and not personal. Always have a backup plan (Plan
            B club) to suggest to guests so their night isn't ruined.
          </li>
        </ul>
      </div>,
    ],
    quiz: [
      {
        question: "What must guests do to visit the dome of the Reichstag?",
        options: [
          "Pay a €10 entry fee at the door",
          "Book online several days in advance",
          "Wear formal attire",
          "Show their hostel keycard",
        ],
        correctIndex: 1,
      },
      {
        question: "Which ticket zone is required to travel from the hostel to BER Airport?",
        options: ["Zone A", "Zone AB", "Zone BC", "Zone ABC"],
        correctIndex: 3,
      },
      {
        question: "What is the most crucial advice to give guests buying paper BVG tickets?",
        options: [
          "Keep it away from magnets",
          "Sign the back of the ticket",
          "Validate (stamp) it on the platform before boarding",
          "Show it to the bus driver immediately",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "vcc-masterclass",
    title: "Demystifying Virtual Credit Cards (VCCs)",
    description:
      "Stop declining guest cards by mistake! Learn the complex mechanics of OTA Virtual Credit Cards, activation dates, and preventing double-charging.",
    duration: "25 mins",
    points: 250,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">1. What is a Virtual Credit Card?</h3>
        <p className="text-lg leading-relaxed">
          When a guest books via an Online Travel Agency (OTA) like Booking.com or Expedia and
          selects "Pay Online", the OTA charges the guest's actual credit card immediately. To pay
          the hostel, the OTA generates a one-time-use Virtual Credit Card (VCC) and sends it to our
          PMS.
        </p>
        <p className="text-lg leading-relaxed text-destructive font-semibold">
          The Biggest Mistake: Asking the guest to pay at check-in!
        </p>
        <p className="text-lg leading-relaxed">
          If you see a VCC attached to the profile, the guest has ALREADY PAID the OTA. Do not
          charge their personal physical card for the room rate, or they will be double-charged and
          furious. You should only take their personal card for incidentals or the Berlin City Tax
          (if it wasn't included by the OTA).
        </p>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">2. The Activation Date Trap</h3>
        <p className="text-lg leading-relaxed">
          The most common reason a VCC is declined with "Insufficient Funds" or "Declined by Issuer"
          is the Activation Date. Most Booking.com VCCs are strictly configured to activate{" "}
          <b>only on the exact date of check-in</b>.
        </p>
        <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-muted-foreground leading-relaxed">
            If a guest cancels non-refundably 3 days before arrival and you try to charge the VCC
            early to secure the revenue, the gateway will reject it. You must set a reminder in the
            PMS to charge the card on the original check-in date.
          </p>
        </div>
      </div>,
      <div key="3" className="space-y-6">
        <h3 className="text-2xl font-bold">3. Handling "No Status" Payments</h3>
        <p className="text-lg leading-relaxed">
          Sometimes, you click "Charge" in the PMS and the loading spinner hangs, eventually
          resulting in a payment with "No Status".
          <b>DO NOT CLICK CHARGE AGAIN!</b>
        </p>
        <p className="text-lg leading-relaxed">
          Clicking charge again often results in double-charging the VCC. Since VCCs have an exact
          fixed limit (down to the cent), the second charge will fail, but the first one might have
          actually succeeded in the background (Adyen/Stripe). Wait 10 minutes, refresh the PMS, or
          ask a manager to check the merchant dashboard before retrying.
        </p>
      </div>,
    ],
    quiz: [
      {
        question:
          "Why did the OTA Virtual Credit Card decline when you tried to take a deposit 3 days before the guest's arrival?",
        options: [
          "The guest doesn't have enough money",
          "The VCC only activates on the exact check-in date",
          "The PMS is offline",
          "You entered the wrong CVC code",
        ],
        correctIndex: 1,
      },
      {
        question: "What should you do if a Mews payment hangs and returns a 'No Status' error?",
        options: [
          "Click 'Charge' repeatedly until it works",
          "Delete the credit card and ask the guest for cash",
          "Wait 10 minutes and check the gateway status before retrying to avoid double-charging",
          "Charge the guest's physical card instead",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "editable-window",
    title: "The 'Editable Window' Accounting Error",
    description:
      "Conquer the most frustrating PMS error: 'Cannot modify consumed items'. Learn how to split bills or extend stays without breaking the Night Audit.",
    duration: "30 mins",
    points: 300,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">1. The Night Audit Lock</h3>
        <p className="text-lg leading-relaxed">
          In a modern PMS like Mews, every night at 2:00 AM, the system runs the Night Audit. This
          process takes all the consumed revenue (the rooms people actually slept in that night) and
          locks it for accounting purposes.
        </p>
        <p className="text-lg leading-relaxed">
          This time limit is called the <b>Accounting Editable Window</b>. Once an item is outside
          this window, you cannot change its price, change the dates, or delete it. If you try, the
          PMS throws a massive red error: "Cannot modify consumed items."
        </p>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">2. Extending a Stay Correctly</h3>
        <p className="text-lg leading-relaxed">
          If a guest has been here for 3 days and suddenly wants to stay 2 more nights, you cannot
          simply click on their arrival date and change the departure date in a single sweep if the
          arrival date is locked.
        </p>
        <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-muted-foreground leading-relaxed">
            <b>The Fix:</b> Do not touch the past dates. Either use the specific "Extend Stay"
            button which appends new nights to the timeline, or create a brand new 2-night
            reservation and link the profiles.
          </p>
        </div>
      </div>,
      <div key="3" className="space-y-6">
        <h3 className="text-2xl font-bold">3. Splitting Closed Bills (Rebates)</h3>
        <p className="text-lg leading-relaxed">
          A corporate guest checks out. Two hours later, they email you:{" "}
          <i>"Please put my breakfast on a separate invoice for my company!"</i>
        </p>
        <p className="text-lg leading-relaxed">
          If the invoice is already closed and locked by the system, you cannot drag and drop items
          off it. You must issue a <b>Rebate (Credit Note)</b> for the entire closed invoice to
          cancel it out legally. Then, the items will reappear on the guest's open profile, allowing
          you to split them into two new, correctly formatted invoices.
        </p>
      </div>,
    ],
    quiz: [
      {
        question:
          "Why does the PMS show 'Cannot modify consumed items' when you try to change a reservation?",
        options: [
          "The guest hasn't paid yet",
          "The night audit has already locked those past items for strict accounting compliance",
          "You don't have manager permissions",
          "The room is marked out of order",
        ],
        correctIndex: 1,
      },
      {
        question: "How do you fix a guest invoice that has already been closed and finalized?",
        options: [
          "Unlock it with a manager password",
          "Issue a Rebate (Credit Note) to cancel it, then generate new invoices",
          "Tell the guest it is illegal to change it in Germany",
          "Delete the guest profile and start over",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "multi-legs-overbooking",
    title: "Complex Timeline Ops: Multi-Legs & Overbookings",
    description:
      "Handle the messy reality of hostel dorms versus the digital reality of the PMS timeline.",
    duration: "20 mins",
    points: 200,
    content: [
      <div key="1" className="space-y-6">
        <h3 className="text-2xl font-bold">1. The Multi-Leg Booking</h3>
        <p className="text-lg leading-relaxed">
          In peak Berlin summer, we are often 100% booked. Sometimes a guest books 5 nights, but
          there is no single bed available for all 5 nights continuously. The PMS will automatically
          create a <b>Multi-Leg Reservation</b> (e.g., nights 1-2 in Bed A, nights 3-5 in Bed B).
        </p>
        <p className="text-lg leading-relaxed text-destructive font-semibold">
          Crucial Step: Informing the Guest at Check-in
        </p>
        <p className="text-lg leading-relaxed">
          You must explicitly tell the guest at check-in:{" "}
          <i>
            "You have a room move on Wednesday. You must pack your bags and bring them to reception
            by 11 AM."
          </i>
          If you forget this, the guest will leave their stuff in Bed A, the new guest will arrive
          at 3 PM, and we will have a massive logistical crisis.
        </p>
      </div>,
      <div key="2" className="space-y-6">
        <h3 className="text-2xl font-bold">2. Physical vs. System Overbookings</h3>
        <p className="text-lg leading-relaxed">
          You assign a new guest to Bed 4. They come back down and say:{" "}
          <i>"Someone is sleeping in my bed."</i>
          The PMS says Bed 4 is empty and clean. What happened?
        </p>
        <p className="text-lg leading-relaxed">
          Never blindly reassign the new guest without investigating. It could be a squatter from
          another bed who just moved over, a guest who overslept check-out, or a housekeeping error.
          Go to the room physically. Ask to see the squatter's keycard sleeve to verify who they are
          and fix the physical reality before touching the PMS.
        </p>
      </div>,
      <div key="3" className="space-y-6">
        <h3 className="text-2xl font-bold">3. Space Statuses: Dirty vs. Legionella</h3>
        <p className="text-lg leading-relaxed">
          You might see a room blocked out with the status <b>"Dirty (Legionella)"</b>.
        </p>
        <p className="text-lg leading-relaxed">
          This is an automated safety feature. If a room has been vacant for 7 days, the water in
          the pipes hasn't moved, risking Legionella bacteria growth. Housekeeping must physically
          go to the room, run all taps and showers with hot water for 5 minutes, and then clear the
          status in the PMS. Do not check guests into a Legionella-flagged room!
        </p>
      </div>,
    ],
    quiz: [
      {
        question:
          "What is the most crucial step when checking in a guest with a multi-leg (split) reservation?",
        options: [
          "Give them two keycards immediately",
          "Informing them explicitly that they will need to pack up and switch beds during their stay",
          "Upgrading them for free to avoid the move",
          "Charging them double city tax",
        ],
        correctIndex: 1,
      },
      {
        question:
          "What should you do if a bed is assigned to a new guest in the PMS, but the guest says there are bags on it?",
        options: [
          "Throw the bags in the hallway",
          "Just put the new guest in another bed and ignore it",
          "Go to the room physically to investigate whose bags they are before touching the PMS",
          "Call the police immediately",
        ],
        correctIndex: 2,
      },
    ],
  },
];

export const LEADERBOARD = [
  { id: "1", name: "Sarah M.", points: 850, role: "Front Office Manager" },
  { id: "2", name: "David K.", points: 620, role: "Night Auditor" },
  { id: "3", name: "Julia L.", points: 410, role: "Senior Receptionist" },
  { id: "4", name: "Emma W.", points: 280, role: "Receptionist" },
  { id: "5", name: "Tom B.", points: 120, role: "Reception Trainee" },
];
