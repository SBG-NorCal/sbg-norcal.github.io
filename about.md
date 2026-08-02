---
layout: page
title: About SBG NorCal
permalink: /about/
hero_image: /assets/images/hero/about-hero.jpg
eyebrow: Our Story
lead: "Function Not Fantasy — since 2003. The East Bay's home for empirical, evidence-based martial arts."
---

<span class="eyebrow">The story</span>

## Where we come from

SBG NorCal was formed in **2002 by Lily and Alan Pagle** and has been a member of
**Straight Blast Gym International** since 2003. SBG is a global network founded in
Portland, Oregon, by Matt Thornton, built on two ideas that still shape every class
we teach: **Aliveness** and the **I-Method**.

Aliveness is simple: **if it's not trained alive, it's not learned.** Every skill is
developed against a partner who is genuinely resisting, so you learn it with the
timing, energy, and motion of a real exchange. We teach what holds up under real
pressure — because the conditions a skill is built under are the conditions it holds
up in, on the mats and off them.

The I-Method is how a technique gets from your head into your reflexes. It's the
progression every student moves through, and it's where the name of our Integrations
classes comes from:

- **Introduction** — learn the mechanics cooperatively, with no resistance, until the
  shape of the movement is right.
- **Isolation** — drill it as a constrained game with one objective: recover guard,
  say, while your partner's only job is to deny your knee line. The constraint keeps
  the new skill in front of you instead of your best move, and the resistance rises as
  you succeed and eases when you don't.
- **Integration** — put the part back into the whole. Full rolling, where you find out
  *when* the skill shows up on its own.

Most gyms skip that middle stage, and it's the one that matters. Thornton's criticism
of conventional teaching is precise: repetitions without resistance don't involve
timing, so students never build timing at the movement itself — they're left to find
it later, under fire.

## What we offer

We teach the most efficient delivery systems of **stand-up, clinch, and ground**:

- **Brazilian Jiu-Jitsu** — sport and self-defense, beginner-friendly
- **Kickboxing / Muay Thai** — striking with safety as a non-negotiable
- **Boxing Bootcamp** — total-body workout with real skills
- **MMA** — for students with a base in striking and grappling
- **Fitness 101** — coached strength and mobility
- **Youth Martial Arts** — for ages 3 through 17

## Run as a nonprofit

SBG NorCal is organized as a nonprofit under **Martial Arts Training and Scholarship**
(MATS), a 501(c)(3). All our coaches graduate from our year-long coach's course, and
all of them are volunteers. That model lets every dollar from membership go back into
the gym — and into scholarships.

We have scholarship programs for Youth & Families offered through Berkeley Unified
School District, and for Young Adults through the Berkeley Adult School. Alongside
our paid martial arts and fitness programs, we offer **free community workshops** for
everyone, covering fitness, self-defense, and wellness.

We take great pride in being the place where people of different backgrounds and
experiences can get together and help each other become the best versions of
themselves on the mat and in their communities.

<h2 id="lineage">Lineage</h2>

We sit in two of the most respected lineages in modern martial arts:

- **Brazilian Jiu-Jitsu**: Rickson Gracie → Chris Haueter → Matt Thornton → Lily Pagle (4th dan BJJ black belt).
- **Judo**: Lily Pagle (2nd dan) and Alan Pagle (2nd dan), both internationally graded.

That lineage matters because it means everything you learn here has been **pressure-tested
through generations of competitors** and refined through real coaching, not handed down
as ceremony.

<div class="divider-line"></div>

<span class="eyebrow">Meet the team</span>
## Coaches

{% assign sorted_coaches = site.coaches | where_exp: "c", "c.hidden != true" | sort: 'order' %}
<div class="coaches-grid" style="margin-top:2rem;">
  {% for coach in sorted_coaches %}
    {% include coach-card.html coach=coach %}
  {% endfor %}
</div>

<div class="divider-line"></div>

{% include cta-banner.html %}
