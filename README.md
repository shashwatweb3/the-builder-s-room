# The Builder's Room

Build a complete, polished, responsive community platform called The Rec Room.

Do not build this as a simple marketing landing page.

Build it as a real community website / builder hub with a polished public-facing experience and multiple functional sections that can later be connected to a backend.

The product should feel like a digital recreation room for builders — a place people visit to discover opportunities, meet other builders, showcase projects, find collaborators, and participate in the community.

The entire website must use one consistent visual language, color system, typography system, spacing system, component system, and interaction language across every page.

Use the attached reference images as the primary visual inspiration for the design language:

warm off-white background

oversized black typography

vivid purple accent

thin black borders

chunky black offset shadows

rounded cards

editorial layouts

lots of whitespace

monospace labels

playful but minimal UI

Do NOT copy the reference website's branding, copy, layouts, illustrations, or identity.

Create an original identity for The Rec Room.

1. PRODUCT POSITIONING

Brand:

The Rec Room

Descriptor:

A recreation room for builders.

Core idea:

Find things worth building.
Find people worth building with.

The Rec Room brings together:

Jobs

Hackathons

Residencies

Ambassador programs

Builder profiles

Projects

Collaboration

Community discovery

The site should eventually become a community, not just an opportunity directory.

Think:

Internet clubhouse × builder community × opportunity board × project showcase

It should feel welcoming, slightly playful, independent, creative, and builder-first.

Avoid corporate startup language.

Avoid phrases such as:

revolutionizing

empowering the future

next-generation ecosystem

unlock your potential

innovative solutions

Use natural language that sounds like builders talking to builders.

2. VISUAL IDENTITY

COLOR PALETTE

Use a strict design system.

Primary background:

Warm ivory / cream
approximately #F5F3EF

Primary text:

Almost black
approximately #111111

Primary accent:

Vivid purple
approximately #8B5CF6

Secondary purple:

Soft lavender

Card background:

White / slightly warm white

Borders:

Black

Shadows:

Black

Do not introduce lots of additional colors.

Purple should be used as the recognizable brand accent.

3. TYPOGRAPHY

Use a modern geometric/grotesk font.

Prefer:

Manrope / Space Grotesk / Inter

Use:

Extra bold typography for major headings

Medium/semibold for UI

Monospace for small labels and metadata

Hero headings should be very large on desktop.

Typography must scale intelligently on mobile.

Never allow oversized text to overflow or overlap.

4. DESIGN LANGUAGE

Every major card should follow the same visual system:

Black border

Rounded corners

White/ivory surface

Chunky black offset shadow

Clear hierarchy

Purple accent where appropriate

Use shadows like:

4px 5px 0px #111111

Do not use generic blurry SaaS shadows.

Buttons should feel tactile.

Hover:

move slightly upward

shadow becomes stronger

Pressed:

move toward the shadow

shadow becomes smaller

Use subtle animations throughout.

5. GLOBAL NAVIGATION

Desktop navbar:

Left:

The Rec Room

Center/left navigation:

Opportunities
Ambassadors
Builders
Projects

Right:

Join the Room

Optional small status indicator:

● ROOM OPEN

The navbar should be sticky.

On scroll:

slightly change background

maintain visibility

never obscure page content

Mobile:

Logo left.

Menu button right.

Opening menu should display:

Home
Opportunities
Ambassadors
Builders
Projects
Join the Room

The mobile menu must feel polished and match the brand.

6. HOME PAGE

Route:

/

Build a premium editorial homepage.

HERO

Small label:

A RECREATION ROOM FOR BUILDERS

Huge heading:

Find something worth building.

Supporting copy:

Jobs. Hackathons. Residencies. Ambassador programs. Projects. People to build with.

Secondary paragraph:

The Rec Room is a place for builders to find their next opportunity, discover interesting projects, and meet people who actually ship.

Buttons:

Explore opportunities →

Meet the builders

Hero should have an original visual on the right.

Create a large outlined "room" interface containing floating cards:

JOB
OPEN NOW

HACKATHON
7 DAYS LEFT

RESIDENCY
APPLICATIONS OPEN

AMBASSADOR
LOOKING FOR BUILDERS

PROJECT
BUILDING

Add subtle floating motion.

Do not use stock photography.

7. LIVE ROOM STATUS

Immediately below hero create a compact status strip.

Example:

● LIVE

37 opportunities are currently open

Right side:

Updated moments ago

Use small monospace typography.

8. PURPLE STATEMENT BANNER

Large horizontal purple card.

Black offset shadow.

Text:

There's always something to build.

Secondary:

The hard part is finding what is worth your time.

9. OPPORTUNITIES SECTION

Label:

WHAT'S HAPPENING IN THE ROOM

Heading:

Pick your next thing.

Create 4 category cards:

JOBS

Find your next role.

Show:

24 live

CTA:

Explore →

HACKATHONS

Build something. Ship something. Win something.

Show:

18 live

CTA:

Explore →

RESIDENCIES

Go somewhere interesting. Build with interesting people.

Show:

7 open

CTA:

Explore →

GRANTS

Get support for something you're building.

Show:

12 open

CTA:

Explore →

Cards should be visually different but use the same component system.

10. LIVE OPPORTUNITIES PREVIEW

Heading:

Things worth applying to.

Tabs:

ALL
JOBS
HACKATHONS
RESIDENCIES
GRANTS

Show 6 cards.

Each card contains:

Category
Title
Organization
Description
Tags
Location
Remote status
Deadline
Compensation/prize when applicable
Apply →

Include realistic demo data.

Clearly structure demo data so it can later be replaced with API/database data.

Add:

View all opportunities →

11. OPPORTUNITIES PAGE

Route:

/opportunities

This must be a fully functional directory.

Hero:

Things worth applying to.

Supporting text:

A living collection of jobs, hackathons, residencies and grants for people who build.

Controls:

Search

Category tabs

Filters

Filters:

Remote
Paid
Location
Ecosystem
Skill
Deadline
Closing Soon

Sort:

Newest
Deadline
Popular

Cards should update dynamically based on filters/search.

Use client-side filtering with structured demo data.

Add pagination / Load more.

Each opportunity should have a detailed expandable or dedicated detail experience.

12. OPPORTUNITY DETAIL

Create:

/opportunities/:id

Detail page should include:

Category

Opportunity title

Organization

Description

Requirements

Who it's for

Compensation / prize

Location

Deadline

Tags

Application link

Related opportunities

Save opportunity button

Share button

Back to opportunities

Make the page feel editorial rather than like a boring database entry.

13. AMBASSADOR PAGE

Route:

/ambassadors

Hero:

Represent something you believe in.

Copy:

Find live ambassador and community programs looking for people to help grow interesting projects.

Filters:

OPEN
PAID
REMOTE
COMMUNITY
CONTENT
DEVELOPER
REGIONAL

Create polished program cards.

Each card:

Organization

Program name

Description

Program type

Perks

Reward

Deadline

Status

Apply →

Include a featured ambassador program at the top.

14. AMBASSADOR DETAIL PAGE

Route:

/ambassadors/:id

Include:

Program name

Organization

About the program

What ambassadors do

Requirements

Benefits

Rewards

Time commitment

Application deadline

Application button

Related programs

15. BUILDERS PAGE

Route:

/builders

Hero:

The people in the room.

Supporting copy:

Developers, designers, founders, researchers, writers, community builders and curious people making things.

Search builders.

Filters:

Developer
Designer
Founder
Researcher
Writer
Community
Product
Other

Also filter:

Looking for collaborators

Available for work

Building something

Open to opportunities

Create builder cards.

Each:

Avatar

Name

Role

Short bio

Skills

Current project

Location

Links

Status

Example:

BUILDING

OPEN TO COLLABS

16. BUILDER PROFILE PAGE

Route:

/builders/:id

Create a proper profile experience.

Include:

Avatar

Name

Role

Bio

Skills

Location

Social links

Website

Current project

Past projects

Contributions

Opportunities

Looking for

Builder stats

Example:

Projects shipped
3

Hackathons
8

Collaborations
12

Keep the stats visually subtle.

Important:

Do not make this feel like a corporate LinkedIn profile.

It should feel like an independent builder profile.

17. PROJECTS PAGE

Route:

/projects

Hero:

What people are building.

Copy:

Interesting things made by people in the room.

Filters:

ALL
BUILDING
LIVE
EXPERIMENT
LOOKING FOR HELP

Search projects.

Project cards include:

Project name

One-line pitch

Builder

Category

Tech stack

Status

GitHub

Live demo

Project image / abstract visual

18. PROJECT DETAIL

Route:

/projects/:id

Create a rich project page.

Include:

Project name

Status

Description

Builder(s)

Problem

What they're building

Tech stack

Links

Screenshots / visual placeholders

Updates

People involved

Looking for:

Designer
Developer
Researcher
Community
etc.

CTA:

I want to help →

This should eventually support collaboration.

19. COLLABORATION SECTION

Create a major section on the Builders page and Projects page:

Headline:

Need someone to ship with?

Copy:

Good projects rarely happen alone. Find someone with the skills you're missing.

Buttons:

Find a builder

Start a project

Create a visually distinctive purple panel.

20. COMMUNITY PAGE

Route:

/community

Create a community landing area even if the actual social backend doesn't exist yet.

Hero:

Pull up a chair.

Show:

Community members
Projects
Opportunities
Conversations
Events

Create sections:

Who's around

What people are building

What's happening

Looking for collaborators

Include placeholder community activity cards.

Example:

Maya started building a new project.

Alex is looking for a designer.

12 builders joined this week.

A new hackathon was added.

This should feel like a living room, not a social media clone.

21. JOIN THE ROOM

Create a reusable join CTA across the website.

Headline:

Pull up a chair.

Copy:

Get the interesting stuff without the noise.

Email input.

Button:

Join the Room

Client-side success:

You're in. See you in the room.

Add optional checkboxes:

☐ Opportunities

☐ Community updates

☐ New projects

Keep it simple.

22. SUBMIT PAGE

Route:

/submit

Headline:

Got something worth sharing?

Allow users to submit:

Job
Hackathon
Residency
Grant
Ambassador program
Project

Form:

Type

Title

Organization

URL

Description

Deadline

Location

Remote

Tags

Compensation

Contact

Additional information

Submit button:

Send it to the room →

After submission:

Nice. We've got it.

We'll review it before it hits the room.

Implement client-side validation.

23. EVENTS PAGE

Create:

/events

This can support future community events.

Show:

Meetups
Hackathons
Workshops
Demo days
Community calls

Cards:

Event name

Date

Location

Online/offline

Organizer

CTA

24. SEARCH

Create a global search experience.

Search across:

Opportunities
Builders
Projects
Programs
Events

Keyboard shortcut:

⌘ K

Create a polished command/search modal.

Results should be grouped.

Example:

OPPORTUNITIES

Builder Residency
Protocol Engineer

BUILDERS

Maya Chen
Protocol Designer

PROJECTS

Open Source Wallet

25. SAVED ITEMS

Add a small save/bookmark interaction to:

Opportunities
Projects
Builders

Use localStorage for now.

Create a /saved page.

Tabs:

Opportunities
Projects
Builders

Empty state:

Nothing saved yet.

Go find something interesting.

26. RESPONSIVE DESIGN

This is extremely important.

Build desktop, tablet and mobile layouts intentionally.

Do NOT simply shrink the desktop design.

Desktop:

Large editorial composition.

Tablet:

Two-column where appropriate.

Mobile:

Single-column.

Hero typography must scale.

Cards should stack naturally.

Navigation becomes a mobile menu.

Filters become horizontally scrollable or a filter drawer.

Tables should NEVER overflow horizontally.

Forms must be comfortable to use on mobile.

Buttons should have adequate touch targets.

No:

overlapping text

clipped text

horizontal overflow

broken cards

elements extending outside viewport

tiny unreadable typography

Test every route at:

375px
390px
430px
768px
1024px
1440px
1920px

27. COMPONENT SYSTEM

Create reusable components.

Required:

Navbar
MobileMenu
Footer
SectionLabel
Button
OffsetCard
OpportunityCard
OpportunityGrid
OpportunityFilters
OpportunityDetail
AmbassadorCard
AmbassadorDetail
BuilderCard
BuilderProfile
ProjectCard
ProjectDetail
EventCard
SearchModal
FilterBar
Tag
StatusBadge
JoinCTA
FAQ
EmptyState
LoadingState
Toast
Modal

Do not duplicate components unnecessarily.

28. INTERACTION SYSTEM

Every interaction should feel intentional.

Buttons:

Hover
Press
Focus

Cards:

Hover translation
Shadow movement

Links:

Subtle underline / arrow animation

FAQ:

Smooth accordion

Search:

⌘K

Filters:

Instant updates

Saved items:

Animated bookmark state

Forms:

Validation
Loading
Success
Error

Navigation:

Smooth transitions

Page transitions should be subtle.

29. DATA ARCHITECTURE

Do not hardcode UI directly into every component.

Create structured TypeScript data models.

For example:

Opportunity
AmbassadorProgram
Builder
Project
Event

Store demo data separately.

This must make it easy to replace demo data with Supabase/API later.

30. FUTURE BACKEND READINESS

Do not build authentication/database yet unless necessary.

But structure the frontend so the following can later be added:

User accounts

Builder profiles

Project submissions

Opportunity submissions

Saved items

Community posts

Comments

Applications

Notifications

Admin moderation

Do not create fake backend functionality.

Clearly separate demo/local functionality from future backend functionality.

31. ACCESSIBILITY

Use:

Semantic HTML

Keyboard navigation

Visible focus states

ARIA labels where needed

Accessible dialogs

Accessible accordions

Accessible form errors

Sufficient contrast

Buttons must actually be buttons.

Links must actually be links.

32. SEO

Add proper metadata.

Homepage title:

The Rec Room — A Recreation Room for Builders

Description:

Discover jobs, hackathons, residencies, ambassador programs, projects and people worth building with.

Use appropriate metadata for each major route.

33. FOOTER

Footer should include:

THE REC ROOM

A recreation room for builders.

Navigation:

Opportunities
Ambassadors
Builders
Projects
Events
Community
Submit

Social:

X
Discord
GitHub

Bottom:

Built for people who ship.

34. COPY STYLE

The tone should be:

Confident
Short
Human
Playful
Builder-first

Examples:

Find something worth building.

Things worth applying to.

The people in the room.

What are you building?

Need someone to ship with?

Pull up a chair.

There's always something to build.

Avoid long marketing paragraphs.

35. VISUAL DETAILS

Add subtle details throughout the site:

Tiny purple dots

LIVE indicators

Monospace timestamps

Small labels

Arrow icons

Handwritten-feeling microcopy where appropriate

Tiny floating cards

Offset shadows

Editorial separators

Occasional purple highlight

Use these sparingly.

The site should feel designed, not decorated.

36. EMPTY STATES

Every major directory needs a beautiful empty state.

Example:

Nothing here yet.

Give it a minute. The room is growing.

CTA:

Explore everything →

37. LOADING STATES

Create skeleton/loading states matching the design system.

Do not use generic default skeletons.

38. ERROR STATES

Create friendly branded error states.

Example:

Well, that didn't work.

The room lost the signal.

Try again →

39. 404 PAGE

Create a memorable 404.

Large:

404

Headline:

You wandered into the wrong room.

CTA:

Back to The Rec Room →

40. IMPORTANT DESIGN RULE

The entire website must look like it came from one extremely good designer.

Do not let individual pages look like separate templates.

All pages must share:

Same colors
Same typography
Same borders
Same shadows
Same radius
Same spacing
Same buttons
Same labels
Same animation language
Same navigation
Same footer

41. FINAL QUALITY BAR

Before considering the build complete, check every route.

Check:

Desktop
Tablet
Mobile

Check:

Typography
Spacing
Alignment
Overflow
Interactions
Buttons
Forms
Navigation
Filtering
Search
Empty states
Loading states
Error states
404
Accessibility

Fix every visual issue you find.

Especially look for:

text overlapping other text

cards becoming too narrow

hero sections breaking on mobile

buttons overflowing

navigation collisions

horizontal scrolling

inconsistent spacing

FINAL CREATIVE DIRECTION

The Rec Room should feel like:

You opened a website and accidentally found the coolest room on the internet for people who build things.

It should be:

minimal but expressive

playful but not childish

technical but not intimidating

community-driven but not noisy

modern but not generic

The visual reference should influence the entire experience, especially:

warm ivory background

black typography

purple accent

chunky offset shadows

outlined cards

rounded geometry

oversized typography

editorial whitespace

But the final product must have a unique The Rec Room identity.

Build the complete frontend now with all routes, reusable components, realistic demo data, functional client-side interactions, responsive layouts, and polished states.

Do not stop after creating the homepage.

The goal is a complete, navigable Krew3 community platform MVP.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
