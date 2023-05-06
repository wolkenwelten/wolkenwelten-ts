# Design Notes

A battle royale game with elemental attacks and a fully destructible environment, where attacks interact with each other and the environment (Fireball + Windgust = Inferno).

## Longer description
Players start somewhere on the Island, grab sticks and stones to kill their first mobs which then hopefully drop better weapons or even better, runestones. The main focus for the combat lies in the rune attacks, and mainly their combinatory potential, especially allowing for team-based attacks (One shoots water at a group of enemies while another one uses Icegust to freeze everyone in place, followed by a comet that kills everyone since they can't run).

# Runestones
Special attacks can be utilized using Runestones, they have a cooldown but a player could have multiple Runestones for the same attack. A player can wear 10 (used by pressing 0-9 keys) at once.

## Firebreath
Breath fire onto everything in front of the player
- Low range
- Only does damage over time

## Comet
Conjure a comet from the skies
- Very slow to actually hit
- Absolutely Devastating if it hits

## Lightning strike
Summon a bolt of lightning from the skies
- Does big amounts of damage to a single target
- Does AoE damage in Water/when Wet

## Windstorm
Strong winds blow everything away (also blows Fire far and wide)
- No Damage
- Throws many Entities a bit back
- Devastating if done after a Firebreath

## Icegust
Slows everything down it hits and blows it away slightly, turns water to ice and freezes wet Entities
- No Damage
- Only really useful if combined with Watertorrent

## Watertorrent
Shoot a torrent of water at a Target
- Extinguishes flames
- Throw one Entity far away, doing no damage by itself
- Makes the target wet, making it resistant to fire damage but very vulerable to shock

## Healingwave
Create a wave of healing water
- Heals everyone in it's path, extinguishing them but also making them wet

## Earthwall
Erect whatever earthen blocks are in front of the player into a defensive wall
- Great defense against most attacks
- Only works if Dirt/Stone is in front of the player
- Throws whatever is standing on the blocks into that direction

## Earthbullet
Shoot whatever block is in front of the player up and away at the target
- Takes a while for the bullet/block to fly
- Does medium amounts of damage
- Slom projectile
- Can be blocked by Windstorm/Watertorrent/Earthen wall

# Weapons
Mostly melee weapons, since it is more exciting if an encounter doesn't just end the instance one is seen by the enemy.

## Swords
Close range, fast, high damage

### Dai-Katana 大<刀
The ultimate weapon
- Close range
- Fast

### Gladius
- Close range
- Fast

### Stone shiv
Somewhat common, can be found lying around
- Very close range
- Fast
- Medium damage

## Spear
Spears have long range

### Naginata 薙刀
Not the most popular, I suppose, but a favorite of mine
- Long range
- Quite Slow

### Trident
A trident

### Pointy stick

## Blunt weapons
Close range, ignores armor

### Kanabō 金棒
Massive club, very powerful
- Close range
- Ignores armor / deadly

### Club
Simple club, can be found lying around everywhere
- Close range
- Weak

### Stick
It's a stick... probably not what you want to be using for long
- Close range
- Super weak

# Mobs
These server mainly as more interesting Chests/Boxes, since searching/looting is kind of boring. They should also serve to gate the more powerful weapons/runes until after players have advanced at least a little bit and allow for clear paths on how to get specific runes allowing for planned builds.

## Crab
A crab, not that dangerous though they appear in packs proving dangerous if one doesn't have proper weapons/runes.
- Drops Watertorrent / Healingwave runes

## King crab
A massive crab, quite dangerous without runes
- Drops Watertorrent / Icegust / Trident

## Drake
A small wingless dragon, can breath fire though making it quite dangerous
- Drops Firebreath
- Drops Gladius

## Dragon
A bigger wingless dragon (to keep the AI manageable)
- Drops Firebreath and Comet
- Drops Gladius and sometimes Dai-Katanas

## Goblin warrior
A small Goblin warrior armed with Clubs/shields
- Drops Earthwall
- Drops Club

## Hobgoblin
A pretty big Goblin, chieftain to the lil'ones
- Drops Earthbullet
- Drops Club and sometimes Kanabō

## Demonic monkey
Small monkey like creatures, throwing stones from a distance, not being that dangerous but quite the nuisance
- Drops Windstorm

## Demon gorilla
Massive gorilla
- Drops Windstorm / Lightning bolt / Naginata

# Elemental systems
I hope I can implement these, since we have a very little perf. Budget due to the switch to the Browser as the sole platform.
Overall elemental interactions should rather err on the side of being too strong/overexagarated, since this is supposed to be a fast action packed game.

## Fire
Fire should slowly spread, burning Entities take damage until they jump in water or get doused some other way.
- Pretty much like wolkenwelten-c

## Water
Water should flow in a reasonable way and not just spread endlessly
- Similar to wolkenwelten-c, maybe turn into particles when falling?

## Shock
Should spread over Water/Wet entities, damaging all, fixing global damage thereby reducing strength the more mobs are hit would make sense but doesn't sound fun, should probably damage everyone the same.

## Ice
Just a straight block, turns to water on contact with fire though. Frozen enemies can't move but also can't burn (fire unfreezes them, doing no damage). Should also have increased weight.

## Wind
Mainly applies a force to entities, but greatly spreads fire in the direction it blows, should be somewhat overpowered.

# General style / Inspirations
Generally players should feel empowered, like benders from Avatar, having power over the elements to crush their enemies. Making combination attacks devastating feel cool by themselves, but should also make teamwork all the more imporant, since a well working group should be able to absolutely devastate everyone. To further this feeling of power/control most attacks should have an effect on the Environment, and feel somewhat akin to Dragonball. Visual inspiration, especially for effects should be drawn from Kimetsu no Yaiba and Chainsaw Man (really liked the way Aki summons the Fox demon, looked pretty cool to me), although it will have to show what actually works and makes sense inside the game, since it all has to work together.

# Setting
A floating Island, that shrinks because it crumbles from the outside in. That way we limit the play area to a small Island, and also have a way to shove players close to each other.

The starting location needs to be chosen somehow, right now I don't know how, spawning in randomly seems kinda boring, Fortnie/Apex were kinda nice in that regard, though I don't wanna copy them blindly.

# Open Questions

## Starting location
I think it would be better if players can choose where they spawn, especially if there is a clear risk/reward correlation in starting locations. I kinda like the idea of worldgen being something that players can witness, where you see the island coming together as you glide through the skies. Still only a vague idea for now though.

## Cut weapons
Weapons aren't strictly necessary, so they might be cut since the focus should probably lie on the runes/magic.

## Cut mobs
They also aren't essential, might be better to focus on the core which is PvP, although once they get dropped we need another way for runes to drop, and mobs seem like kinda fun Treasure chests that can fight back.


# Ideas to try out

Instead of the current fire system, store a temperature (diffential) and then ignite blocks/entities based on that. That way we could also do hot/cold weather. Even nicer would be if we also simulated oxygen supply at some level, so that one could extinguish (or strengthen) a flame.