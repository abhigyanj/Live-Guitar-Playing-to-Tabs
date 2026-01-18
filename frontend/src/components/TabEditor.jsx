import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import LiveRecorderPanel from './LiveRecorderPanel'
import { useAudioContext } from '../contexts/AudioContext'

const API_URL = 'http://127.0.0.1:5000'

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']
const INITIAL_BARS = 4
const NOTES_PER_BAR = 8

// Technique symbols and their visual representations
const TECHNIQUES = {
  'h': { name: 'Hammer-on', color: 'text-blue-400', symbol: '⌢' },
  'p': { name: 'Pull-off', color: 'text-purple-400', symbol: '⌣' },
  '/': { name: 'Slide Up', color: 'text-green-400', symbol: '↗' },
  '\\': { name: 'Slide Down', color: 'text-yellow-400', symbol: '↘' },
  'x': { name: 'Muted', color: 'text-red-400', symbol: '✕' },
  'X': { name: 'Muted', color: 'text-red-400', symbol: '✕' },
}

// Famous guitar riffs as sample tabs - Classic Rock & Modern Hits
const SAMPLE_TABS = [
  // ==================== CLASSIC ROCK EXTENDED ====================
  {
    id: 'smoke-on-water-extended',
    name: 'Smoke on the Water',
    artist: 'Deep Purple',
    tempo: 112,
    section: 'Full Riff (Extended)',
    genre: 'classic-rock',
    difficulty: 'beginner',
    tab: `e|------------------|------------------|------------------|------------------|
B|------------------|------------------|------------------|------------------|
G|--0--3--5--0--3-6-|--5--0--3--5--3--0|--0--3--5--0--3-6-|--5--0--3--5--3--0|
D|--0--3--5--0--3-6-|--5--0--3--5--3--0|--0--3--5--0--3-6-|--5--0--3--5--3--0|
A|------------------|------------------|------------------|------------------|
E|------------------|------------------|------------------|------------------|`
  },
  {
    id: 'seven-nation-extended',
    name: 'Seven Nation Army',
    artist: 'The White Stripes',
    tempo: 124,
    section: 'Full Riff with Variation',
    genre: 'classic-rock',
    difficulty: 'beginner',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|------------------------|------------------------|--7--7--10--7--12-10-9--|--7--7--10--7--5--3--2--|
A|--7--7--10--7--5--3--2--|--7--7--10--7--5--3--2--|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'iron-man-extended',
    name: 'Iron Man',
    artist: 'Black Sabbath',
    tempo: 76,
    section: 'Full Intro',
    genre: 'classic-rock',
    difficulty: 'beginner',
    tab: `e|--------------------|--------------------|--------------------|-----------------|
B|--------------------|--------------------|--------------------|-----------------|
G|--------------------|--------------------|--------------------|--11-11-14-11-14-|
D|--2--5--5--7--7--9--|--9--12-12-14-14-15-|--2--5--5--7--7--9--|--11-11-14-11-14-|
A|--2--5--5--7--7--9--|--9--12-12-14-14-15-|--2--5--5--7--7--9--|--9--9--12-9--12-|
E|--0--3--3--5--5--7--|--7--10-10-12-12-13-|--0--3--3--5--5--7--|-----------------|`
  },
  {
    id: 'enter-sandman-extended',
    name: 'Enter Sandman',
    artist: 'Metallica',
    tempo: 123,
    section: 'Full Intro Riff',
    genre: 'metal',
    difficulty: 'intermediate',
    tab: `e|-----------------------|-----------------------|-----------------------|-----------------------|
B|-----------------------|-----------------------|-----------------------|-----------------------|
G|-----------------------|-----------------------|-----------------------|-----------------------|
D|-----------------------|--0--0--0--7--6--5--0--|--0--0--0--7--6--5--0--|--7--6--5--7--6--5--0--|
A|--7--6--5--0--0--6--5--|--7--6--5----------5---|--7--6--5----------5---|----------------------5|
E|--0--0--0----------0---|--0--0--0--0--0--0--0--|--0--0--0--0--0--0--0--|--0--0--0--0--0--0--0--|`
  },
  {
    id: 'back-in-black-extended',
    name: 'Back in Black',
    artist: 'AC/DC',
    tempo: 92,
    section: 'Intro & Verse',
    genre: 'classic-rock',
    difficulty: 'intermediate',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|--2--2--2--2--2--2--2--2|------------------------|--2--2--2--2--2--2--2--2|
D|--0--2--0-----0--2--3--2|--2--2--2--2--2--2--2--2|--0--2--0-----0--2--3--2|--2--2--2--2--2--2--2--2|
A|----------2-------------|--0--0--0--0--0--0--0--0|----------2-------------|--0--0--0--0--0--0--0--0|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'sunshine-extended',
    name: 'Sunshine of Your Love',
    artist: 'Cream',
    tempo: 112,
    section: 'Full Verse Riff',
    genre: 'classic-rock',
    difficulty: 'intermediate',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|--12-12-11-12--12-8-10--|--12-12-11-12--12-8-10--|--10-10-9--10--10-6--8--|--10-10-9--10--10-6--8--|
A|------------------------|--10-10-9--10--10-6--8--|------------------------|--8--8--7--8---8--4--6--|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'day-tripper-extended',
    name: 'Day Tripper',
    artist: 'The Beatles',
    tempo: 138,
    section: 'Full Riff & Turnaround',
    genre: 'classic-rock',
    difficulty: 'intermediate',
    tab: `e|-------------------------------|-------------------------------|-------------------------------|
B|-------------------------------|-------------------------------|-------------------------------|
G|-------------------------------|-------------------------------|--4--4--2--2--0--0--2--2--4--4-|
D|----------0--2--0--2--4--4--2--|----------2--4--2--4--6--6--4--|--4--4--2--2--0--0--2--2--4--4-|
A|--0--2--4----------------------|--2--4--6----------------------|--2--2--0--0-----------0--2--2-|
E|-------------------------------|-------------------------------|-------------------------------|`
  },
  {
    id: 'satisfaction-extended',
    name: '(I Can\'t Get No) Satisfaction',
    artist: 'The Rolling Stones',
    tempo: 136,
    section: 'Extended Riff',
    genre: 'classic-rock',
    difficulty: 'beginner',
    tab: `e|-----------------------|-----------------------|-----------------------|-----------------------|
B|--2--4--5--5--5--4--2--|--2--4--5--5--5--4--2--|--2--4--5--5--5--4--2--|--4--4--2--2--0--0--2--|
G|-----------------------|-----------------------|-----------------------|-----------------------|
D|-----------------------|-----------------------|-----------------------|-----------------------|
A|-----------------------|-----------------------|-----------------------|-----------------------|
E|-----------------------|-----------------------|-----------------------|-----------------------|`
  },
  {
    id: 'come-as-you-are-extended',
    name: 'Come As You Are',
    artist: 'Nirvana',
    tempo: 120,
    section: 'Verse & Chorus',
    genre: 'alternative',
    difficulty: 'beginner',
    tab: `e|--0--0--1--2--2--1--0--0--|--0--0--1--2--2--1--0--0--|--0--0--1--2--2--1--0--0--|--0--0--1--2--2--1--0--0--|
B|-------------------------|-------------------------|--3--3--3--3--3--3--3--3--|--3--3--3--3--3--3--3--3--|
G|-------------------------|-------------------------|--2--2--2--2--2--2--2--2--|--2--2--2--2--2--2--2--2--|
D|-------------------------|-------------------------|-------------------------|-------------------------|
A|-------------------------|-------------------------|-------------------------|-------------------------|
E|-------------------------|-------------------------|-------------------------|-------------------------|`
  },
  {
    id: 'thunderstruck-extended',
    name: 'Thunderstruck',
    artist: 'AC/DC',
    tempo: 134,
    section: 'Full Intro Pattern',
    genre: 'classic-rock',
    difficulty: 'advanced',
    tab: `e|--0--0--0--0--0--0--0--0--|--0--0--0--0--0--0--0--0--|--0--0--0--0--0--0--0--0--|--0--0--0--0--0--0--0--0--|
B|--5--4--5--4--5--4--5--4--|--7--5--7--5--7--5--7--5--|--9--7--9--7--9--7--9--7--|--5--4--5--4--5--4--5--4--|
G|-------------------------|-------------------------|-------------------------|-------------------------|
D|-------------------------|-------------------------|-------------------------|-------------------------|
A|-------------------------|-------------------------|-------------------------|-------------------------|
E|-------------------------|-------------------------|-------------------------|-------------------------|`
  },
  {
    id: 'sweet-child-extended',
    name: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    tempo: 122,
    section: 'Full Intro Arpeggio',
    genre: 'classic-rock',
    difficulty: 'advanced',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|--12-12-15-12-14-12-14--|--12-12-15-12-14-12-14--|--12-12-15-12-14-12-14--|--12-12-15-12-14-12-14--|
G|----------------------14|----------------------14|--14-14-16-14-14-14-16--|--14-14-16-14-14-14-16--|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'purple-haze-extended',
    name: 'Purple Haze',
    artist: 'Jimi Hendrix',
    tempo: 109,
    section: 'Intro & Main Riff',
    genre: 'classic-rock',
    difficulty: 'intermediate',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|--8--8--8--8--8--8--8--8|------------------------|--8--8--8--8--8--8--8--8|
G|--0--3--4--0--3--4--5--4|--9--9--9--9--9--9--9--9|--0--3--4--0--3--4--5--4|--9--9--9--9--9--9--9--9|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  // ==================== MODERN POP/ROCK STYLE TABS ====================
  {
    id: 'modern-pop-ballad',
    name: 'Modern Pop Ballad Style',
    artist: 'Practice Exercise',
    tempo: 72,
    section: 'Emotional Arpeggio Pattern',
    genre: 'pop',
    difficulty: 'beginner',
    tab: `e|--0-----0-----0-----0---|--0-----0-----0-----0---|--0-----0-----0-----0---|--0-----0-----0-----0---|
B|----1-----1-----1-----1-|----1-----1-----1-----1-|----3-----3-----3-----3-|----1-----1-----1-----1-|
G|------0-----0-----0-----0|------2-----2-----2-----2|------2-----2-----2-----2|------0-----0-----0-----0|
D|--2-----------2---------|--2-----------2---------|--0-----------0---------|--2-----------2---------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'latin-pop-groove',
    name: 'Latin Pop Groove Style',
    artist: 'Practice Exercise',
    tempo: 96,
    section: 'Reggaeton-Inspired Pattern',
    genre: 'pop',
    difficulty: 'intermediate',
    tab: `e|--x--x--x--x--x--x--x--x|--x--x--x--x--x--x--x--x|--x--x--x--x--x--x--x--x|--x--x--x--x--x--x--x--x|
B|--5--5--5--5--5--5--5--5|--5--5--5--5--5--5--5--5|--7--7--7--7--7--7--7--7|--5--5--5--5--5--5--5--5|
G|--5--5--5--5--5--5--5--5|--6--6--6--6--6--6--6--6|--7--7--7--7--7--7--7--7|--5--5--5--5--5--5--5--5|
D|--5--5--5--5--5--5--5--5|--7--7--7--7--7--7--7--7|--5--5--5--5--5--5--5--5|--5--5--5--5--5--5--5--5|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'indie-rock-jangle',
    name: 'Indie Rock Jangle Style',
    artist: 'Practice Exercise',
    tempo: 118,
    section: 'Clean Guitar Pattern',
    genre: 'alternative',
    difficulty: 'intermediate',
    tab: `e|--0--0--0--0--0--0--0--0|--3--3--3--3--3--3--3--3|--0--0--0--0--0--0--0--0|--3--3--3--3--3--3--3--3|
B|--0--0--0--0--0--0--0--0|--0--0--0--0--0--0--0--0|--1--1--1--1--1--1--1--1|--0--0--0--0--0--0--0--0|
G|--0--0--0--0--0--0--0--0|--0--0--0--0--0--0--0--0|--2--2--2--2--2--2--2--2|--0--0--0--0--0--0--0--0|
D|--2--2--2--2--2--2--2--2|--0--0--0--0--0--0--0--0|--2--2--2--2--2--2--2--2|--0--0--0--0--0--0--0--0|
A|--2--2--2--2--2--2--2--2|--2--2--2--2--2--2--2--2|--0--0--0--0--0--0--0--0|--2--2--2--2--2--2--2--2|
E|--0--0--0--0--0--0--0--0|--3--3--3--3--3--3--3--3|------------------------|--3--3--3--3--3--3--3--3|`
  },
  {
    id: 'pop-punk-power',
    name: 'Pop Punk Power Chords',
    artist: 'Practice Exercise',
    tempo: 170,
    section: 'Fast Power Chord Progression',
    genre: 'alternative',
    difficulty: 'intermediate',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|------------------------|------------------------|------------------------|
G|--9--9--9--9--6--6--6--6|--4--4--4--4--6--6--6--6|--9--9--9--9--6--6--6--6|--4--4--4--4--6--6--6--6|
D|--9--9--9--9--6--6--6--6|--4--4--4--4--6--6--6--6|--9--9--9--9--6--6--6--6|--4--4--4--4--6--6--9--9|
A|--7--7--7--7--4--4--4--4|--2--2--2--2--4--4--4--4|--7--7--7--7--4--4--4--4|--2--2--2--2--4--4--7--7|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'rnb-soul-chords',
    name: 'R&B Soul Chord Style',
    artist: 'Practice Exercise',
    tempo: 68,
    section: 'Neo-Soul Voicings',
    genre: 'pop',
    difficulty: 'advanced',
    tab: `e|--x-----x-----x-----x---|--x-----x-----x-----x---|--x-----x-----x-----x---|--x-----x-----x-----x---|
B|--8-----8-----8-----8---|--6-----6-----6-----6---|--5-----5-----5-----5---|--6-----6-----6-----6---|
G|--7-----7-----7-----7---|--7-----7-----7-----7---|--5-----5-----5-----5---|--7-----7-----7-----7---|
D|--9-----9-----9-----9---|--6-----6-----6-----6---|--6-----6-----6-----6---|--6-----6-----6-----6---|
A|--7-----7-----7-----7---|--8-----8-----8-----8---|--7-----7-----7-----7---|--8-----8-----8-----8---|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'trap-guitar-melody',
    name: 'Trap Guitar Melody Style',
    artist: 'Practice Exercise',
    tempo: 140,
    section: 'Dark Melodic Pattern',
    genre: 'pop',
    difficulty: 'beginner',
    tab: `e|--12----15----12----10--|--12----15----17----15--|--12----15----12----10--|--8-----10----12----10--|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'country-pop-picking',
    name: 'Country Pop Picking Style',
    artist: 'Practice Exercise',
    tempo: 108,
    section: 'Hybrid Picking Pattern',
    genre: 'country',
    difficulty: 'intermediate',
    tab: `e|--0-----0-----0-----0---|--2-----2-----2-----2---|--0-----0-----0-----0---|--2-----2-----2-----2---|
B|----0-----0-----0-----0-|----3-----3-----3-----3-|----0-----0-----0-----0-|----3-----3-----3-----3-|
G|------0-----0-----0-----0|------2-----2-----2-----2|------0-----0-----0-----0|------2-----2-----2-----2|
D|--0-----------0---------|--0-----------0---------|--2-----------2---------|--0-----------0---------|
A|------------------------|------------------------|--2-----------2---------|------------------------|
E|------------------------|------------------------|--0-----------0---------|------------------------|`
  },
  {
    id: 'edm-guitar-lead',
    name: 'EDM Guitar Lead Style',
    artist: 'Practice Exercise',
    tempo: 128,
    section: 'Electronic Rock Riff',
    genre: 'pop',
    difficulty: 'intermediate',
    tab: `e|--12-12-12-15-12-15-17--|--15-15-15-17-15-17-19--|--12-12-12-15-12-15-17--|--17-17-17-15-15-12-10--|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'afrobeat-rhythm',
    name: 'Afrobeat Rhythm Style',
    artist: 'Practice Exercise',
    tempo: 108,
    section: 'Syncopated Groove',
    genre: 'world',
    difficulty: 'intermediate',
    tab: `e|--x--3--x--3--x--3--x--3|--x--5--x--5--x--5--x--5|--x--3--x--3--x--3--x--3|--x--5--x--5--x--5--x--5|
B|--x--3--x--3--x--3--x--3|--x--5--x--5--x--5--x--5|--x--3--x--3--x--3--x--3|--x--5--x--5--x--5--x--5|
G|--x--4--x--4--x--4--x--4|--x--6--x--6--x--6--x--6|--x--4--x--4--x--4--x--4|--x--6--x--6--x--6--x--6|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'kpop-guitar-rhythm',
    name: 'K-Pop Guitar Rhythm Style',
    artist: 'Practice Exercise',
    tempo: 120,
    section: 'Bright Pop Progression',
    genre: 'pop',
    difficulty: 'intermediate',
    tab: `e|--0--0--0--0--0--0--0--0|--0--0--0--0--0--0--0--0|--0--0--0--0--0--0--0--0|--0--0--0--0--0--0--0--0|
B|--5--5--5--5--8--8--8--8|--10-10-10-10-8--8--8--8|--5--5--5--5--8--8--8--8|--10-10-10-10-8--8--5--5|
G|--6--6--6--6--9--9--9--9|--9--9--9--9--9--9--9--9|--6--6--6--6--9--9--9--9|--9--9--9--9--9--9--6--6|
D|--7--7--7--7--10-10-10-10|--10-10-10-10-10-10-10-10|--7--7--7--7--10-10-10-10|--10-10-10-10-10-10-7--7|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'rock-ballad-solo',
    name: 'Rock Ballad Solo Style',
    artist: 'Practice Exercise',
    tempo: 65,
    section: 'Emotional Lead Line',
    genre: 'classic-rock',
    difficulty: 'advanced',
    tab: `e|--15----17----15----12--|--15----17----19----17--|--15----17----15----12--|--10----12----15----12--|
B|------------------------|-----------20----20-17--|------------------------|--13----13----13----13--|
G|------------------------|------------------------|--12----14----12----11--|------------------------|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'fingerstyle-pop',
    name: 'Fingerstyle Pop Arrangement',
    artist: 'Practice Exercise',
    tempo: 85,
    section: 'Melody & Bass Pattern',
    genre: 'acoustic',
    difficulty: 'advanced',
    tab: `e|--0-----3-----5-----3---|--0-----3-----5-----7---|--5-----3-----0-----3---|--5-----3-----0---------|
B|----1-----1-----1-----1-|----1-----1-----1-----1-|----1-----1-----1-----1-|----1-----1-----1-----1-|
G|------0-----0-----0-----0|------0-----0-----0-----0|------0-----0-----0-----0|------0-----0-----0-----0|
D|--2-----------2---------|--2-----------2---------|--2-----------2---------|--2-----------2---------|
A|------------------------|------------------------|------------------------|------------------------|
E|--0-----------0---------|--0-----------0---------|--0-----------0---------|--0-----------0---------|`
  },
  {
    id: 'blues-rock-lick',
    name: 'Blues Rock Lick',
    artist: 'Practice Exercise',
    tempo: 90,
    section: 'Extended 12-Bar Solo',
    genre: 'blues',
    difficulty: 'intermediate',
    tab: `e|------------------------|------------------------|--8--10----8--10----8---|--10-8-----10-8-----10--|
B|--8--10----8--10----8---|--11-8-----11-8-----11--|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|------------------------|------------------------|------------------------|------------------------|
A|------------------------|------------------------|------------------------|------------------------|
E|------------------------|------------------------|------------------------|------------------------|`
  },
  {
    id: 'metal-breakdown',
    name: 'Metal Breakdown Style',
    artist: 'Practice Exercise',
    tempo: 95,
    section: 'Heavy Djent Pattern',
    genre: 'metal',
    difficulty: 'advanced',
    tab: `e|------------------------|------------------------|------------------------|------------------------|
B|------------------------|------------------------|------------------------|------------------------|
G|------------------------|------------------------|------------------------|------------------------|
D|--0--0--x--0--0--x--0--0|--3--3--x--3--3--x--5--5|--0--0--x--0--0--x--0--0|--3--3--x--5--5--x--7--7|
A|--0--0--x--0--0--x--0--0|--3--3--x--3--3--x--5--5|--0--0--x--0--0--x--0--0|--3--3--x--5--5--x--7--7|
E|--0--0--x--0--0--x--0--0|--1--1--x--1--1--x--3--3|--0--0--x--0--0--x--0--0|--1--1--x--3--3--x--5--5|`
  },
  {
    id: 'spanish-flamenco',
    name: 'Spanish Flamenco Style',
    artist: 'Practice Exercise',
    tempo: 120,
    section: 'Rasgueado Pattern',
    genre: 'world',
    difficulty: 'advanced',
    tab: `e|--0--0--0--0--1--1--1--1|--3--3--3--3--1--1--1--1|--0--0--0--0--1--1--1--1|--3--3--1--1--0--0--0--0|
B|--1--1--1--1--1--1--1--1|--0--0--0--0--1--1--1--1|--1--1--1--1--1--1--1--1|--0--0--1--1--1--1--1--1|
G|--0--0--0--0--2--2--2--2|--0--0--0--0--2--2--2--2|--0--0--0--0--2--2--2--2|--0--0--2--2--0--0--0--0|
D|--2--2--2--2--3--3--3--3|--0--0--0--0--3--3--3--3|--2--2--2--2--3--3--3--3|--0--0--3--3--2--2--2--2|
A|--3--3--3--3--3--3--3--3|--2--2--2--2--3--3--3--3|--3--3--3--3--3--3--3--3|--2--2--3--3--3--3--3--3|
E|------------------------|--3--3--3--3------------|------------------------|--3--3------------------|`
  }
]

// Genre categories for filtering
const GENRE_CATEGORIES = [
  { id: 'all', label: 'All Tabs', icon: '🎸', color: 'amber' },
  { id: 'classic-rock', label: 'Classic Rock', icon: '🤘', color: 'red' },
  { id: 'metal', label: 'Metal', icon: '⚡', color: 'purple' },
  { id: 'alternative', label: 'Alternative', icon: '🎵', color: 'green' },
  { id: 'pop', label: 'Pop & Modern', icon: '✨', color: 'pink' },
  { id: 'blues', label: 'Blues', icon: '🎷', color: 'blue' },
  { id: 'acoustic', label: 'Acoustic', icon: '🪕', color: 'orange' },
  { id: 'country', label: 'Country', icon: '🤠', color: 'yellow' },
  { id: 'world', label: 'World Music', icon: '🌍', color: 'teal' },
]

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'emerald', icon: '●' },
  intermediate: { label: 'Intermediate', color: 'amber', icon: '●●' },
  advanced: { label: 'Advanced', color: 'red', icon: '●●●' },
}

function TabEditor({ darkMode }) {
  // Audio context for live recording integration
  const audioContext = useAudioContext()
  const { 
    detectedNotes, 
    isListening, 
    syncToEditor, 
    onNotesChanged,
    getNotesAsTabData 
  } = audioContext
  
  const [bars, setBars] = useState(INITIAL_BARS)
  const [tempo, setTempo] = useState(120)
  const [timeSignature, setTimeSignature] = useState({ top: 4, bottom: 4 })
  const [sectionName, setSectionName] = useState('Intro')
  const [tabData, setTabData] = useState(() => {
    const initial = {}
    STRINGS.forEach(str => {
      initial[str] = Array(INITIAL_BARS * NOTES_PER_BAR).fill('')
    })
    return initial
  })
  const [selectedCell, setSelectedCell] = useState(null)
  const [toast, setToast] = useState(null)
  const [savedTabs, setSavedTabs] = useState([])
  const [mode, setMode] = useState('grid')
  const [textInput, setTextInput] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(-1)
  const [showTechniqueHints, setShowTechniqueHints] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [showSampleTabs, setShowSampleTabs] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [sampleTabFilter, setSampleTabFilter] = useState('all')
  const [sampleTabSearch, setSampleTabSearch] = useState('')
  
  // Live recorder panel state
  const [showLivePanel, setShowLivePanel] = useState(false)
  const [liveInsertPosition, setLiveInsertPosition] = useState(0)
  
  // Practice Mode State
  const [showPracticeMode, setShowPracticeMode] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStart, setLoopStart] = useState(null) // Column index for A point
  const [loopEnd, setLoopEnd] = useState(null) // Column index for B point
  const [repeatCount, setRepeatCount] = useState(0) // 0 = infinite
  const [currentRepeat, setCurrentRepeat] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(100) // Percentage
  const [gradualSpeedUp, setGradualSpeedUp] = useState(false)
  const [speedIncrement, setSpeedIncrement] = useState(5) // % increase per loop
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [settingLoopPoint, setSettingLoopPoint] = useState(null) // 'A' or 'B' or null
  
  const tabRef = useRef(null)
  const pdfRef = useRef(null)
  const audioContextRef = useRef(null)
  const playbackRef = useRef(null)
  const cellInputRefs = useRef({})
  const lastSyncedNotesCount = useRef(0)

  useEffect(() => {
    loadSavedTabs()
  }, [])

  // Focus the selected cell when it changes via arrow keys
  useEffect(() => {
    if (selectedCell) {
      const key = `${selectedCell.string}-${selectedCell.col}`
      const inputEl = cellInputRefs.current[key]
      if (inputEl) {
        inputEl.focus()
      }
    }
  }, [selectedCell])

  // Real-time sync from live transcription
  useEffect(() => {
    if (!syncToEditor || !isListening) return
    
    // Only process new notes (ones we haven't seen yet)
    if (detectedNotes.length > lastSyncedNotesCount.current) {
      const newNotes = detectedNotes.slice(lastSyncedNotesCount.current)
      
      newNotes.forEach((note, idx) => {
        if (note.position) {
          const insertCol = liveInsertPosition + lastSyncedNotesCount.current + idx
          
          // Expand bars if needed
          const totalCols = bars * NOTES_PER_BAR
          if (insertCol >= totalCols) {
            const neededBars = Math.ceil((insertCol + 1) / NOTES_PER_BAR)
            setBars(neededBars)
          }
          
          // Insert the note
          setTabData(prev => {
            const updated = { ...prev }
            const targetString = note.position.string
            const fretValue = note.position.fret.toString()
            
            // Ensure we have enough columns
            STRINGS.forEach(str => {
              const neededLength = Math.max(updated[str].length, insertCol + 1)
              if (updated[str].length < neededLength) {
                updated[str] = [...updated[str], ...Array(neededLength - updated[str].length).fill('')]
              }
            })
            
            // Set the note
            updated[targetString] = updated[targetString].map((v, i) => 
              i === insertCol ? fretValue : v
            )
            
            return updated
          })
        }
      })
      
      lastSyncedNotesCount.current = detectedNotes.length
    }
  }, [detectedNotes, syncToEditor, isListening, liveInsertPosition, bars])

  // Reset sync counter when listening stops
  useEffect(() => {
    if (!isListening) {
      // Update insert position to after current notes
      if (lastSyncedNotesCount.current > 0) {
        setLiveInsertPosition(prev => prev + lastSyncedNotesCount.current)
      }
      lastSyncedNotesCount.current = 0
    }
  }, [isListening])

  const loadSavedTabs = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-tabs`)
      setSavedTabs(response.data.tabs)
    } catch (error) {
      console.error('Error loading tabs:', error)
    }
  }

  const handleFretChange = (string, col, value) => {
    if (value !== '' && !/^[0-9]{1,2}$|^[xXhHpP\/\\bBrRvV~]$/.test(value)) return
    if (value !== '' && !isNaN(value) && parseInt(value) > 24) return

    setTabData(prev => ({
      ...prev,
      [string]: prev[string].map((v, i) => i === col ? value : v)
    }))
  }

  const handleKeyDown = (e, stringIdx, col) => {
    const totalCols = bars * NOTES_PER_BAR
    
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (col < totalCols - 1) {
        setSelectedCell({ string: stringIdx, col: col + 1 })
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (col > 0) {
        setSelectedCell({ string: stringIdx, col: col - 1 })
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (stringIdx < STRINGS.length - 1) {
        setSelectedCell({ string: stringIdx + 1, col })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (stringIdx > 0) {
        setSelectedCell({ string: stringIdx - 1, col })
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (col < totalCols - 1) {
        setSelectedCell({ string: stringIdx, col: col + 1 })
      } else if (stringIdx < STRINGS.length - 1) {
        setSelectedCell({ string: stringIdx + 1, col: 0 })
      }
    }
  }

  const addBar = () => {
    setBars(prev => prev + 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = [...prev[str], ...Array(NOTES_PER_BAR).fill('')]
      })
      return updated
    })
  }

  const removeBar = () => {
    if (bars <= 1) return
    setBars(prev => prev - 1)
    setTabData(prev => {
      const updated = {}
      STRINGS.forEach(str => {
        updated[str] = prev[str].slice(0, -NOTES_PER_BAR)
      })
      return updated
    })
  }

  const clearAll = () => {
    setTabData(() => {
      const cleared = {}
      STRINGS.forEach(str => {
        cleared[str] = Array(bars * NOTES_PER_BAR).fill('')
      })
      return cleared
    })
  }

  const generateTabText = () => {
    let text = ''
    STRINGS.forEach(str => {
      const frets = tabData[str].map(f => {
        if (f === '') return '--'
        if (f.length === 1) return '-' + f
        return f
      }).join('-')
      text += `${str}|${frets}|\n`
    })
    return text
  }

  const saveTab = async () => {
    const tabText = mode === 'grid' ? generateTabText() : textInput
    
    if (!tabText.trim()) {
      showToast('Please enter some tab data first', 'error')
      return
    }

    try {
      const response = await axios.post(`${API_URL}/save-tab`, {
        tab_data: tabText,
        section_name: sectionName,
        tempo: tempo
      })
      showToast(`Saved as ${response.data.filename}`, 'success')
      loadSavedTabs()
    } catch (error) {
      showToast('Error saving tab', 'error')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Helper function to convert oklch colors to RGB for PDF export
  const convertOklchToRgb = (element) => {
    const clone = element.cloneNode(true)
    
    const convertColors = (el) => {
      const computedStyle = window.getComputedStyle(el)
      const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
      
      colorProps.forEach(prop => {
        const value = computedStyle[prop]
        if (value && value.includes('oklch')) {
          // Create a temp element to get the computed RGB value
          const temp = document.createElement('div')
          temp.style[prop] = value
          document.body.appendChild(temp)
          const rgb = window.getComputedStyle(temp)[prop]
          document.body.removeChild(temp)
          el.style[prop] = rgb
        }
      })
      
      Array.from(el.children).forEach(convertColors)
    }
    
    convertColors(clone)
    return clone
  }

  // Export to PDF
  const exportToPDF = async () => {
    if (!pdfRef.current) {
      showToast('Nothing to export', 'error')
      return
    }
    
    setIsExporting(true)
    showToast('Generating PDF...', 'success')
    
    try {
      // Clone the element and apply inline styles to avoid oklch color issues
      const clone = pdfRef.current.cloneNode(true)
      clone.style.position = 'absolute'
      clone.style.left = '-9999px'
      clone.style.top = '0'
      clone.style.backgroundColor = '#1e293b'
      document.body.appendChild(clone)
      
      // Apply computed styles as inline styles to handle oklch colors
      const applyComputedStyles = (original, cloned) => {
        const computedStyle = window.getComputedStyle(original)
        const importantProps = ['color', 'backgroundColor', 'borderColor', 'fontFamily', 'fontSize', 'fontWeight']
        importantProps.forEach(prop => {
          try {
            const value = computedStyle[prop]
            if (value) {
              cloned.style[prop] = value
            }
          } catch (e) {
            // Ignore errors for unsupported properties
          }
        })
        
        const originalChildren = original.children
        const clonedChildren = cloned.children
        for (let i = 0; i < originalChildren.length; i++) {
          if (clonedChildren[i]) {
            applyComputedStyles(originalChildren[i], clonedChildren[i])
          }
        }
      }
      
      applyComputedStyles(pdfRef.current, clone)
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#1e293b',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        onclone: (clonedDoc) => {
          // Additional color conversion in the cloned document
          const elements = clonedDoc.querySelectorAll('*')
          elements.forEach(el => {
            const style = el.getAttribute('style') || ''
            if (style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, '#64748b'))
            }
          })
        }
      })
      
      // Clean up the clone
      document.body.removeChild(clone)
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      // Calculate proper scaling to fit within the page
      const maxImgHeight = pdfHeight - 80 // Leave room for header and footer
      const maxImgWidth = pdfWidth - 20
      const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight)
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio
      const imgX = (pdfWidth - scaledWidth) / 2
      
      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(79, 70, 229) // Indigo
      pdf.text('Guitar Tab Studio', pdfWidth / 2, 15, { align: 'center' })
      
      // Add section info - use simpler text to avoid encoding issues
      pdf.setFontSize(14)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${sectionName} | Tempo: ${tempo} BPM | ${timeSignature.top}/${timeSignature.bottom}`, pdfWidth / 2, 22, { align: 'center' })
      
      // Add tab image
      pdf.addImage(imgData, 'PNG', imgX, 30, scaledWidth, scaledHeight)
      
      // Calculate where text notation should start
      const textStartY = Math.min(30 + scaledHeight + 8, pdfHeight - 40)
      
      // Add text preview if there's room
      if (textStartY < pdfHeight - 35) {
        pdf.setFontSize(10)
        pdf.setTextColor(50, 50, 50)
        pdf.text('Text Notation:', 14, textStartY)
        
        // Use default font (Helvetica) which is always available
        pdf.setFontSize(8)
        const tabText = generateTabText().split('\n').filter(line => line.trim())
        const maxLines = Math.floor((pdfHeight - textStartY - 15) / 4)
        tabText.slice(0, Math.min(tabText.length, maxLines)).forEach((line, i) => {
          pdf.text(line, 14, textStartY + 6 + (i * 4))
        })
      }
      
      // Add legend at bottom
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Legend: h=hammer-on  p=pull-off  /=slide up  \\=slide down  x=muted', 14, pdfHeight - 10)
      pdf.text(`Generated by Guitar Tab Studio | ${new Date().toLocaleDateString()}`, pdfWidth - 14, pdfHeight - 10, { align: 'right' })
      
      pdf.save(`${sectionName.replace(/\s+/g, '_')}_tab.pdf`)
      showToast('PDF exported successfully!', 'success')
    } catch (error) {
      console.error('PDF export error:', error)
      showToast(`Error exporting PDF: ${error.message}`, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Guitar string open frequencies (standard tuning)
  const STRING_FREQUENCIES = {
    'e': 329.63, 'B': 246.94, 'G': 196.00,
    'D': 146.83, 'A': 110.00, 'E': 82.41
  }

  const getFretFrequency = (stringName, fret) => {
    const openFreq = STRING_FREQUENCIES[stringName]
    return openFreq * Math.pow(2, fret / 12)
  }

  // Metronome click sound
  const playMetronomeClick = (isDownbeat = false) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioContextRef.current
    
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    // Higher pitch for downbeat, lower for other beats
    osc.type = 'sine'
    osc.frequency.setValueAtTime(isDownbeat ? 1000 : 800, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(isDownbeat ? 0.3 : 0.15, ctx.currentTime + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  }

  const playNote = (frequency, duration = 0.3) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioContextRef.current
    
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(frequency * 2, ctx.currentTime)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    
    gain2.gain.setValueAtTime(0, ctx.currentTime)
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.8)
    
    osc.connect(gainNode)
    osc2.connect(gain2)
    gainNode.connect(ctx.destination)
    gain2.connect(ctx.destination)
    
    osc.start(ctx.currentTime)
    osc2.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
    osc2.stop(ctx.currentTime + duration)
  }

  const playColumn = (colIndex) => {
    STRINGS.forEach(str => {
      const fret = tabData[str][colIndex]
      if (fret && !isNaN(fret) && fret !== 'x' && fret !== 'X') {
        const freq = getFretFrequency(str, parseInt(fret))
        playNote(freq)
      }
    })
  }

  const playTab = () => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    setIsPlaying(true)
    setCurrentRepeat(0)
    const totalCols = bars * NOTES_PER_BAR
    
    // Determine start and end positions based on loop settings
    const startCol = loopEnabled && loopStart !== null ? loopStart : 0
    const endCol = loopEnabled && loopEnd !== null ? loopEnd + 1 : totalCols
    
    let currentCol = startCol
    let repeatsDone = 0
    let currentSpeed = playbackSpeed

    const playNext = () => {
      // Check if we've reached the end of the section
      if (currentCol >= endCol) {
        // Handle looping
        if (loopEnabled) {
          repeatsDone++
          setCurrentRepeat(repeatsDone)
          
          // Check if we've done enough repeats (0 = infinite)
          if (repeatCount > 0 && repeatsDone >= repeatCount) {
            stopPlayback()
            showToast(`Completed ${repeatCount} loops!`, 'success')
            return
          }
          
          // Gradual speed increase
          if (gradualSpeedUp) {
            currentSpeed = Math.min(150, currentSpeed + speedIncrement)
            showToast(`Speed: ${currentSpeed}%`, 'success')
          }
          
          // Reset to start of loop
          currentCol = startCol
        } else {
          stopPlayback()
          return
        }
      }
      
      // Calculate beat duration with current speed
      const adjustedTempo = tempo * (currentSpeed / 100)
      const beatDuration = 60 / adjustedTempo / 2
      
      // Play metronome click on beat
      if (metronomeEnabled) {
        const posInBar = currentCol % NOTES_PER_BAR
        if (posInBar % 2 === 0) { // Click on every 2nd column (quarter notes)
          playMetronomeClick(posInBar === 0)
        }
      }
      
      setPlaybackPosition(currentCol)
      playColumn(currentCol)
      currentCol++
      playbackRef.current = setTimeout(playNext, beatDuration * 1000)
    }

    playNext()
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    setPlaybackPosition(-1)
    setCurrentRepeat(0)
    if (playbackRef.current) {
      clearTimeout(playbackRef.current)
      playbackRef.current = null
    }
  }

  // Set loop point A or B
  const setLoopPoint = (point) => {
    if (selectedCell) {
      if (point === 'A') {
        setLoopStart(selectedCell.col)
        // If B is before A, reset B
        if (loopEnd !== null && loopEnd < selectedCell.col) {
          setLoopEnd(null)
        }
        showToast(`Loop start (A) set at column ${selectedCell.col + 1}`, 'success')
      } else {
        if (loopStart !== null && selectedCell.col >= loopStart) {
          setLoopEnd(selectedCell.col)
          showToast(`Loop end (B) set at column ${selectedCell.col + 1}`, 'success')
        } else {
          showToast('Please set point A first, or select a column after A', 'error')
        }
      }
    } else {
      showToast('Click on a cell to select the loop point', 'error')
    }
    setSettingLoopPoint(null)
  }

  const clearLoopPoints = () => {
    setLoopStart(null)
    setLoopEnd(null)
    setLoopEnabled(false)
    showToast('Loop points cleared', 'success')
  }

  const loadTab = async (filename) => {
    try {
      const response = await axios.get(`${API_URL}/get-tab/${filename}`)
      if (response.data.success) {
        const content = response.data.content
        parseTabContent(content)
        showToast(`Loaded ${filename}`, 'success')
      }
    } catch (error) {
      showToast('Error loading tab', 'error')
    }
  }

  const parseTabContent = (content) => {
    const lines = content.trim().split('\n')
    const newTabData = {}
    let maxCols = 0

    lines.forEach(line => {
      const match = line.match(/^([eBGDAE])\|(.+)\|$/)
      if (match) {
        const stringName = match[1]
        const fretData = match[2]
        const frets = []
        let i = 0
        while (i < fretData.length) {
          if (fretData[i] === '-') {
            if (fretData[i + 1] === '-') {
              frets.push('')
              i += 2
            } else if (fretData[i + 1] && fretData[i + 1] !== '-') {
              frets.push(fretData[i + 1])
              i += 2
            } else {
              i++
            }
          } else if (/[0-9]/.test(fretData[i])) {
            if (/[0-9]/.test(fretData[i + 1])) {
              frets.push(fretData[i] + fretData[i + 1])
              i += 2
            } else {
              frets.push(fretData[i])
              i++
            }
          } else if (/[xXhHpP\/\\]/.test(fretData[i])) {
            frets.push(fretData[i])
            i++
          } else {
            i++
          }
          if (fretData[i] === '-') i++
        }
        newTabData[stringName] = frets
        maxCols = Math.max(maxCols, frets.length)
      }
    })

    const newBars = Math.ceil(maxCols / NOTES_PER_BAR)
    const totalCols = newBars * NOTES_PER_BAR

    STRINGS.forEach(str => {
      if (!newTabData[str]) {
        newTabData[str] = Array(totalCols).fill('')
      } else {
        while (newTabData[str].length < totalCols) {
          newTabData[str].push('')
        }
      }
    })

    setBars(newBars)
    setTabData(newTabData)
    setMode('grid')
  }

  const loadSampleTab = (sample) => {
    parseTabContent(sample.tab)
    setTempo(sample.tempo)
    setSectionName(sample.section)
    setShowSampleTabs(false)
    setSampleTabFilter('all')
    setSampleTabSearch('')
    showToast(`Loaded "${sample.name}" by ${sample.artist}`, 'success')
  }

  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        clearTimeout(playbackRef.current)
      }
    }
  }, [])

  // Get technique info for a value
  const getTechniqueInfo = (value) => {
    if (!value) return null
    const upperVal = value.toUpperCase()
    return TECHNIQUES[value] || TECHNIQUES[upperVal] || null
  }

  // Render a single bar
  const renderBar = (barIndex) => {
    const startCol = barIndex * NOTES_PER_BAR

    return (
      <div key={barIndex} className="flex-shrink-0">
        {/* Bar header with number and live insert indicators */}
        <div className="h-6 flex items-end pb-1 relative">
          <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{barIndex + 1}</span>
          {/* Live insert position indicators */}
          <div className="flex ml-2">
            {Array.from({ length: NOTES_PER_BAR }).map((_, idx) => {
              const col = startCol + idx
              const isInsertPoint = col === liveInsertPosition
              return (
                <div 
                  key={col} 
                  className={`w-8 h-2 flex items-center justify-center ${
                    isInsertPoint && !isListening ? 'text-green-500' : ''
                  }`}
                >
                  {isInsertPoint && !isListening && (
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-green-500"></div>
                  )}
                  {isInsertPoint && isListening && (
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-green-500 animate-pulse"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className={`relative border-l-2 border-r ${darkMode ? 'border-slate-600' : 'border-slate-400'}`}>
          {STRINGS.map((str, stringIdx) => (
            <div key={str} className="flex items-center h-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full h-px ${darkMode ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
              </div>
              
              <div className="flex relative z-10">
                {tabData[str].slice(startCol, startCol + NOTES_PER_BAR).map((fret, idx) => {
                  const col = startCol + idx
                  const isSelected = selectedCell?.string === stringIdx && selectedCell?.col === col
                  const isPlayingCol = playbackPosition === col
                  const technique = getTechniqueInfo(fret)
                  const isLoopStart = loopEnabled && loopStart === col
                  const isLoopEnd = loopEnabled && loopEnd === col
                  const isInLoopSection = loopEnabled && loopStart !== null && loopEnd !== null && col >= loopStart && col <= loopEnd
                  
                  return (
                    <div
                      key={col}
                      className={`w-8 flex items-center justify-center relative transition-all duration-75 
                        ${isPlayingCol ? 'bg-emerald-500/30 scale-105' : ''}
                        ${isInLoopSection && !isPlayingCol ? 'bg-amber-500/10' : ''}
                        ${isLoopStart ? 'border-l-2 border-amber-500' : ''}
                        ${isLoopEnd ? 'border-r-2 border-amber-500' : ''}`}
                    >
                      {/* Loop point markers - only show on first string */}
                      {stringIdx === 0 && isLoopStart && (
                        <div className="absolute -top-5 left-0 z-30">
                          <span className="text-xs font-bold text-amber-500 bg-amber-500/20 px-1 rounded">A</span>
                        </div>
                      )}
                      {stringIdx === 0 && isLoopEnd && (
                        <div className="absolute -top-5 right-0 z-30">
                          <span className="text-xs font-bold text-amber-500 bg-amber-500/20 px-1 rounded">B</span>
                        </div>
                      )}
                      
                      {/* Technique visualization overlay */}
                      {technique && showTechniqueHints && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                          <span className={`text-xs ${technique.color}`}>{technique.symbol}</span>
                        </div>
                      )}
                      
                      <input
                        type="text"
                        ref={(el) => { cellInputRefs.current[`${stringIdx}-${col}`] = el }}
                        className={`w-6 h-6 text-center text-xs font-bold bg-transparent border-0 outline-none transition-all
                          ${technique ? technique.color : (fret ? (darkMode ? 'text-emerald-400' : 'text-indigo-600') : 'text-transparent')}
                          ${isSelected ? `ring-2 ring-emerald-400 rounded ${darkMode ? 'bg-slate-700/80' : 'bg-white/80'}` : ''}
                          ${isPlayingCol && fret ? `${darkMode ? 'text-white' : 'text-indigo-800'} scale-110 font-extrabold` : ''}
                          ${col === liveInsertPosition && !isListening ? 'ring-1 ring-green-500/50' : ''}
                          focus:ring-2 focus:ring-emerald-400 focus:rounded ${darkMode ? 'focus:bg-slate-700/80' : 'focus:bg-white/80'} ${darkMode ? 'focus:text-emerald-400' : 'focus:text-indigo-600'}
                          ${darkMode ? 'placeholder:text-slate-600' : 'placeholder:text-slate-400'} caret-emerald-400`}
                        value={fret}
                        maxLength={2}
                        onChange={(e) => handleFretChange(str, col, e.target.value)}
                        onFocus={() => {
                          setSelectedCell({ string: stringIdx, col })
                          // Set live insert position when clicking a cell (if not currently listening)
                          if (!isListening) {
                            setLiveInsertPosition(col)
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, stringIdx, col)}
                        placeholder="·"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live Recorder Panel - Collapsible */}
      <div className={`transition-all duration-300 ${showLivePanel ? 'mb-4' : ''}`}>
        {showLivePanel ? (
          <LiveRecorderPanel 
            darkMode={darkMode} 
            expanded={true}
            onToggleExpand={() => setShowLivePanel(false)}
          />
        ) : (
          <LiveRecorderPanel 
            darkMode={darkMode} 
            expanded={false}
            onToggleExpand={() => setShowLivePanel(true)}
          />
        )}
      </div>

      {/* Live Recording Status Bar */}
      {isListening && syncToEditor && (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
          darkMode 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
              Live recording to tab
            </span>
          </div>
          <span className={`text-xs ${darkMode ? 'text-green-500/70' : 'text-green-600/70'}`}>
            Insert position: column {liveInsertPosition + 1} • {detectedNotes.length} notes captured
          </span>
          <button
            onClick={() => setLiveInsertPosition(0)}
            className={`ml-auto text-xs px-2 py-1 rounded ${
              darkMode 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Reset position
          </button>
        </div>
      )}

      {/* Main Editor Card */}
      <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-800/50 border border-slate-700 shadow-slate-900/50' 
          : 'bg-white border border-slate-200 shadow-slate-200/50'
      }`}>
        {/* Header Controls */}
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4 ${
          darkMode ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Tab Editor
          </h2>
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sample Tabs Button */}
            <button
              onClick={() => setShowSampleTabs(true)}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl 
                       hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all duration-200 
                       flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
              </svg>
              Sample Tabs
            </button>
            {/* Section Name */}
            <div className="flex items-center gap-2">
              <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Section:</label>
              <input
                type="text"
                className={`w-28 px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white focus:ring-indigo-500' 
                    : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-500'
                } border focus:outline-none focus:ring-2`}
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </div>
            
            {/* Tempo */}
            <div className="flex items-center gap-2">
              <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>♩ =</label>
              <input
                type="number"
                className={`w-16 px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                min={40}
                max={240}
              />
            </div>

            {/* Time Signature */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                className={`w-10 px-1 py-1.5 text-sm text-center rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                value={timeSignature.top}
                onChange={(e) => setTimeSignature(prev => ({ ...prev, top: parseInt(e.target.value) || 4 }))}
                min={1}
                max={16}
              />
              <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>/</span>
              <input
                type="number"
                className={`w-10 px-1 py-1.5 text-sm text-center rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
                } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                value={timeSignature.bottom}
                onChange={(e) => setTimeSignature(prev => ({ ...prev, bottom: parseInt(e.target.value) || 4 }))}
                min={1}
                max={16}
              />
            </div>

            {/* Mode Toggle */}
            <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <button 
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'grid' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm' 
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setMode('grid')}
              >
                Grid
              </button>
              <button 
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'text' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm' 
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setMode('text')}
              >
                Text
              </button>
            </div>

            {/* Technique Hints Toggle */}
            <button
              onClick={() => setShowTechniqueHints(!showTechniqueHints)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                showTechniqueHints
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}
              title="Toggle technique symbols"
            >
              ♪ Hints
            </button>
          </div>
        </div>

        {mode === 'grid' ? (
          <div className="p-6">
            {/* Professional Tab Display */}
            <div 
              ref={pdfRef}
              className={`rounded-xl p-6 overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300'
              }`}
            >
              {/* Section Header */}
              <div className="mb-4 flex items-baseline gap-4 flex-wrap">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{sectionName} - {bars} bars</h3>
                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-indigo-600 font-medium'}`}>♩ = {tempo}</span>
                <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{timeSignature.top}/{timeSignature.bottom} time</span>
              </div>

              {/* Tab Grid */}
              <div className={`overflow-x-auto pb-4 ${darkMode ? 'tab-scrollbar' : 'tab-scrollbar-light'}`} ref={tabRef}>
                <div className="flex gap-0">
                  {/* String Labels */}
                  <div className="flex-shrink-0 pr-2">
                    <div className="h-6"></div>
                    {STRINGS.map((str) => (
                      <div key={str} className="h-8 flex items-center justify-end pr-2">
                        <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{str}</span>
                      </div>
                    ))}
                  </div>

                  {/* Time Signature Display */}
                  <div className="flex-shrink-0 pr-3">
                    <div className="h-6"></div>
                    <div className="flex flex-col items-center justify-center h-48">
                      <span className={`text-2xl font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-800'}`}>{timeSignature.top}</span>
                      <span className={`text-2xl font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-800'}`}>{timeSignature.bottom}</span>
                    </div>
                  </div>

                  {/* Bars */}
                  {Array.from({ length: bars }).map((_, barIdx) => renderBar(barIdx))}

                  {/* End bar line */}
                  <div className={`flex-shrink-0 border-l-2 ${darkMode ? 'border-slate-600' : 'border-slate-500'}`}></div>
                </div>
              </div>

              {/* Enhanced Legend */}
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                <div className="flex flex-wrap gap-4 text-xs">
                  {Object.entries(TECHNIQUES).slice(0, 5).map(([key, tech]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={`font-mono px-1.5 py-0.5 rounded ${tech.color} ${darkMode ? 'bg-slate-800' : 'bg-slate-700'}`}>{key}</span>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{tech.name}</span>
                      <span className={tech.color}>{tech.symbol}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono px-1.5 py-0.5 rounded text-emerald-400 ${darkMode ? 'bg-slate-800' : 'bg-slate-700'}`}>0-24</span>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Fret number</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap mt-4">
              {/* Play Button */}
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25 hover:shadow-red-500/40' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
                }`}
                onClick={playTab}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1"/>
                      <rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                    Stop
                    {loopEnabled && currentRepeat > 0 && (
                      <span className="text-xs opacity-75">({currentRepeat})</span>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                    {playbackSpeed !== 100 && (
                      <span className="text-xs opacity-75">@{playbackSpeed}%</span>
                    )}
                    {loopEnabled && loopStart !== null && loopEnd !== null && (
                      <span className="text-xs opacity-75">🔁</span>
                    )}
                  </>
                )}
              </button>

              {/* Export PDF Button */}
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg
                  bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-purple-500/25 hover:shadow-purple-500/40
                  ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>

              {/* Bar Controls */}
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-1 ${
                  darkMode 
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={addBar}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add Bar
              </button>
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-1 ${
                  darkMode 
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={removeBar}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                </svg>
                Remove Bar
              </button>
              <button 
                className="px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-1"
                onClick={clearAll}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear
              </button>

              {/* Practice Mode Toggle */}
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                  showPracticeMode
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : darkMode 
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => setShowPracticeMode(!showPracticeMode)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Practice Mode
                {showPracticeMode && <span className="text-xs">▼</span>}
              </button>
            </div>

            {/* Practice Mode Panel */}
            {showPracticeMode && (
              <div className={`mt-4 rounded-xl border overflow-hidden transition-all duration-300 ${
                darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Panel Header */}
                <div className={`px-4 py-3 border-b flex items-center gap-2 ${
                  darkMode ? 'border-slate-700 bg-gradient-to-r from-amber-500/10 to-orange-500/10' : 'border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50'
                }`}>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Practice Mode</h3>
                  {isPlaying && currentRepeat > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-500 rounded-full">
                      Loop {currentRepeat}{repeatCount > 0 ? `/${repeatCount}` : ''}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Speed Control Section */}
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Speed Control
                      </h4>
                      <span className={`text-lg font-bold ${
                        playbackSpeed < 100 ? 'text-blue-400' : playbackSpeed > 100 ? 'text-orange-400' : 'text-emerald-400'
                      }`}>
                        {playbackSpeed}%
                      </span>
                    </div>
                    
                    {/* Speed Slider */}
                    <div className="mb-3">
                      <input
                        type="range"
                        min="25"
                        max="150"
                        step="5"
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>25%</span>
                        <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>100%</span>
                        <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>150%</span>
                      </div>
                    </div>
                    
                    {/* Speed Presets */}
                    <div className="flex gap-2 mb-3">
                      {[50, 75, 100, 125].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            playbackSpeed === speed
                              ? 'bg-amber-500 text-white'
                              : darkMode 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {speed}%
                        </button>
                      ))}
                    </div>

                    {/* Gradual Speed Up */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="gradualSpeed"
                          checked={gradualSpeedUp}
                          onChange={(e) => setGradualSpeedUp(e.target.checked)}
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        <label htmlFor="gradualSpeed" className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Gradual speed increase
                        </label>
                      </div>
                      {gradualSpeedUp && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>+</span>
                          <select
                            value={speedIncrement}
                            onChange={(e) => setSpeedIncrement(parseInt(e.target.value))}
                            className={`px-2 py-1 text-xs rounded-lg ${
                              darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-700 border-slate-300'
                            } border`}
                          >
                            <option value={5}>5%</option>
                            <option value={10}>10%</option>
                            <option value={15}>15%</option>
                          </select>
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>per loop</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loop Control Section */}
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Loop Section (A-B)
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enable</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={loopEnabled}
                            onChange={(e) => setLoopEnabled(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${
                            loopEnabled ? 'bg-amber-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                          }`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            loopEnabled ? 'translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>

                    {/* A-B Loop Points */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        onClick={() => setLoopPoint('A')}
                        disabled={!loopEnabled}
                        className={`p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-1 ${
                          loopEnabled
                            ? loopStart !== null
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : darkMode 
                                ? 'border-slate-600 hover:border-amber-500 hover:bg-amber-500/10' 
                                : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                            : 'opacity-50 cursor-not-allowed border-slate-600'
                        }`}
                      >
                        <span className={`text-lg font-bold ${loopStart !== null ? 'text-emerald-400' : 'text-amber-500'}`}>A</span>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {loopStart !== null ? `Column ${loopStart + 1}` : 'Click to set start'}
                        </span>
                      </button>
                      <button
                        onClick={() => setLoopPoint('B')}
                        disabled={!loopEnabled || loopStart === null}
                        className={`p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-1 ${
                          loopEnabled && loopStart !== null
                            ? loopEnd !== null
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : darkMode 
                                ? 'border-slate-600 hover:border-amber-500 hover:bg-amber-500/10' 
                                : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                            : 'opacity-50 cursor-not-allowed border-slate-600'
                        }`}
                      >
                        <span className={`text-lg font-bold ${loopEnd !== null ? 'text-emerald-400' : 'text-amber-500'}`}>B</span>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {loopEnd !== null ? `Column ${loopEnd + 1}` : loopStart === null ? 'Set A first' : 'Click to set end'}
                        </span>
                      </button>
                    </div>

                    {/* Clear Loop Points */}
                    {(loopStart !== null || loopEnd !== null) && (
                      <button
                        onClick={clearLoopPoints}
                        className="w-full py-2 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        Clear Loop Points
                      </button>
                    )}

                    {/* Repeat Count */}
                    <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="flex items-center justify-between">
                        <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Repeat count
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRepeatCount(Math.max(0, repeatCount - 1))}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-200'
                            }`}
                          >
                            −
                          </button>
                          <span className={`w-12 text-center font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {repeatCount === 0 ? '∞' : repeatCount}
                          </span>
                          <button
                            onClick={() => setRepeatCount(repeatCount + 1)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-200'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {repeatCount === 0 ? 'Loop indefinitely until stopped' : `Stop after ${repeatCount} loops`}
                      </p>
                    </div>
                  </div>

                  {/* Metronome Section */}
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0"/>
                          </svg>
                          Metronome Click
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          metronomeEnabled 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {metronomeEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <label className="cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={metronomeEnabled}
                            onChange={(e) => setMetronomeEnabled(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${
                            metronomeEnabled ? 'bg-emerald-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                          }`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            metronomeEnabled ? 'translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Audible click on each beat • Higher pitch on downbeat
                    </p>
                  </div>

                  {/* Quick Tip */}
                  <div className={`p-3 rounded-xl text-xs ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                    <strong>💡 Tip:</strong> Select a cell in the tab grid, then click A or B buttons to set loop points. 
                    The selected section will repeat during playback.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <textarea
              className={`w-full h-64 p-4 font-mono text-sm rounded-xl resize-none transition-colors ${
                darkMode 
                  ? 'bg-slate-900 text-emerald-400 border-slate-700' 
                  : 'bg-slate-800 text-emerald-400 border-slate-600'
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Enter your guitar tabs here...

Example:
e|--0--2--3--0--|
B|--1--3--0--1--|
G|--0--2--0--0--|
D|--2--0--0--2--|
A|--3--x--2--3--|
E|--x--x--3--x--|`}
            />
          </div>
        )}

        {/* Preview Section */}
        <div className={`px-6 pb-6 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Text Preview
            </h3>
            <pre className={`p-4 rounded-xl font-mono text-sm overflow-x-auto ${
              darkMode ? 'bg-slate-900 text-emerald-400' : 'bg-slate-800 text-emerald-400'
            }`}>
              {mode === 'grid' ? generateTabText() : (textInput || 'No tab data entered')}
            </pre>
          </div>

          <div className="mt-6">
            <button 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl 
                       hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 
                       flex items-center gap-2"
              onClick={saveTab}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              Save Tab
            </button>
          </div>
        </div>
      </div>

      {/* Saved Tabs Card */}
      {savedTabs.length > 0 && (
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-white border border-slate-200'
        }`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Saved Tabs
            </h2>
          </div>
          <div className="p-2">
            {savedTabs.map((tab, index) => (
              <div 
                key={index} 
                className={`px-4 py-3 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                  darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{tab}</span>
                </div>
                <button
                  onClick={() => loadTab(tab)}
                  className="px-4 py-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg 
                           hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Tabs Modal */}
      {showSampleTabs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowSampleTabs(false); setSampleTabFilter('all'); setSampleTabSearch(''); }}
          />
          <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700' : 'border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    darkMode ? 'bg-amber-500/20' : 'bg-amber-100'
                  }`}>
                    🎸
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Sample Guitar Tabs
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {SAMPLE_TABS.length} tabs • Learn famous riffs and practice exercises
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSampleTabs(false); setSampleTabFilter('all'); setSampleTabSearch(''); }}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mt-4 relative">
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by song name, artist, or section..."
                  value={sampleTabSearch}
                  onChange={(e) => setSampleTabSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-colors ${
                    darkMode 
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500' 
                      : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-400'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
                {sampleTabSearch && (
                  <button
                    onClick={() => setSampleTabSearch('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Genre Filter Pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {GENRE_CATEGORIES.map((genre) => {
                  const isActive = sampleTabFilter === genre.id
                  const count = genre.id === 'all' 
                    ? SAMPLE_TABS.length 
                    : SAMPLE_TABS.filter(t => t.genre === genre.id).length
                  
                  if (count === 0 && genre.id !== 'all') return null
                  
                  return (
                    <button
                      key={genre.id}
                      onClick={() => setSampleTabFilter(genre.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? darkMode
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                            : 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                          : darkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{genre.icon}</span>
                      <span>{genre.label}</span>
                      <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : darkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Sample Tabs Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
              {(() => {
                const filteredTabs = SAMPLE_TABS.filter(sample => {
                  const matchesFilter = sampleTabFilter === 'all' || sample.genre === sampleTabFilter
                  const matchesSearch = !sampleTabSearch || 
                    sample.name.toLowerCase().includes(sampleTabSearch.toLowerCase()) ||
                    sample.artist.toLowerCase().includes(sampleTabSearch.toLowerCase()) ||
                    sample.section.toLowerCase().includes(sampleTabSearch.toLowerCase())
                  return matchesFilter && matchesSearch
                })
                
                if (filteredTabs.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <svg className={`w-8 h-8 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h4 className={`text-lg font-medium mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>No tabs found</h4>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Try adjusting your search or filter
                      </p>
                      <button
                        onClick={() => { setSampleTabFilter('all'); setSampleTabSearch(''); }}
                        className="mt-4 px-4 py-2 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  )
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTabs.map((sample) => {
                      const difficultyConfig = DIFFICULTY_CONFIG[sample.difficulty] || DIFFICULTY_CONFIG.intermediate
                      const genreConfig = GENRE_CATEGORIES.find(g => g.id === sample.genre) || GENRE_CATEGORIES[0]
                      
                      return (
                        <div
                          key={sample.id}
                          className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-xl ${
                            darkMode 
                              ? 'bg-slate-700/50 border-slate-600 hover:border-amber-500/50 hover:bg-slate-700' 
                              : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-amber-100'
                          }`}
                          onClick={() => loadSampleTab(sample)}
                        >
                          {/* Header with badges */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                {sample.name}
                              </h4>
                              <p className={`text-sm truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {sample.artist}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5 items-end shrink-0">
                              {/* Tempo badge */}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                                darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                ♩ {sample.tempo} BPM
                              </span>
                              {/* Difficulty badge */}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                                difficultyConfig.color === 'emerald'
                                  ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                                  : difficultyConfig.color === 'amber'
                                    ? darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                    : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                              }`}>
                                {difficultyConfig.icon} {difficultyConfig.label}
                              </span>
                            </div>
                          </div>
                          
                          {/* Genre tag */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md ${
                              darkMode ? 'bg-slate-600/50 text-slate-300' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <span>{genreConfig.icon}</span>
                              <span>{genreConfig.label}</span>
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {sample.section}
                            </span>
                          </div>
                          
                          {/* Tab preview */}
                          <div className={`text-xs font-mono p-3 rounded-lg overflow-hidden ${
                            darkMode ? 'bg-slate-900/70 text-emerald-400' : 'bg-slate-900 text-emerald-400'
                          }`}>
                            <pre className="overflow-x-auto whitespace-pre text-[9px] leading-tight opacity-80">
                              {sample.tab.split('\n').slice(0, 4).join('\n')}
                            </pre>
                          </div>
                          
                          {/* Hover action */}
                          <div className={`mt-3 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                              darkMode 
                                ? 'text-amber-400' 
                                : 'text-amber-600'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Load & Play
                            </span>
                          </div>
                          
                          {/* Hover overlay gradient */}
                          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                            darkMode 
                              ? 'bg-gradient-to-t from-amber-500/10 to-transparent' 
                              : 'bg-gradient-to-t from-amber-500/5 to-transparent'
                          }`} />
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              
              {/* Tips section */}
              <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-700/30' : 'bg-gradient-to-r from-amber-50 to-orange-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  💡
                </div>
                <div>
                  <h4 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Quick Tips</h4>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    After loading a sample, use the <span className="text-emerald-500 font-medium">▶ Play</span> button to hear it.
                    Adjust the tempo slider to practice slower. Use the difficulty badges to find tabs matching your skill level.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import from Live Transcription Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Notes Imported!</h2>
                  <p className="text-white/80 text-sm">From live transcription</p>
                </div>
              </div>
            </div>
            
            <div className={`p-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <p className="mb-4">
                The notes from your live transcription have been added to the tab editor. 
                You can now edit, refine, and save your transcription.
              </p>
              
              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <h4 className="font-medium mb-2 text-sm">Tips:</h4>
                <ul className="text-sm space-y-1 opacity-75">
                  <li>• Click on any cell to edit the fret number</li>
                  <li>• Use arrow keys to navigate between cells</li>
                  <li>• Press Play to hear your transcription</li>
                  <li>• Save or export as PDF when you're done</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowImportModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl
                         hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25"
              >
                Got it, let's edit!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl text-white font-medium 
          flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default TabEditor
