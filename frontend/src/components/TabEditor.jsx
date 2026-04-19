import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import LiveRecorderPanel from './LiveRecorderPanel'
import { useAudioContext } from '../contexts/AudioContext'
import { API_URL } from '../config/api'

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

const STUDIO_PANELS = [
  {
    id: 'compose',
    label: 'Compose',
    title: 'Write and capture in one place',
    body: 'Keep the editor central, then use live input when ideas arrive faster than typing.',
  },
  {
    id: 'analyze',
    label: 'Analyze',
    title: 'Turn recordings into editable structure',
    body: 'Run saved or current takes through the analysis pipeline, inspect the output, then import only when it looks useful.',
  },
  {
    id: 'library',
    label: 'Library',
    title: 'Reload earlier drafts quickly',
    body: 'Open saved tabs as a lightweight library instead of treating the studio like a giant dashboard.',
  },
]

const PLAYBACK_PROFILES = {
  warm: {
    label: 'Warm',
    brightness: 2600,
    pickNoise: 0.16,
    overtone2: 0.14,
    overtone3: 0.06,
    detune: 2.4,
    bodyGain: 4.2,
    roomBias: 1.15,
  },
  balanced: {
    label: 'Balanced',
    brightness: 3600,
    pickNoise: 0.22,
    overtone2: 0.18,
    overtone3: 0.09,
    detune: 3.4,
    bodyGain: 3.3,
    roomBias: 1,
  },
  bright: {
    label: 'Bright',
    brightness: 4800,
    pickNoise: 0.28,
    overtone2: 0.22,
    overtone3: 0.12,
    detune: 4.4,
    bodyGain: 2.5,
    roomBias: 0.88,
  },
}

const PLAYBACK_ARTICULATIONS = {
  muted: {
    label: 'Muted',
    attack: 0.0035,
    sustain: 0.42,
    noise: 1.18,
    brightness: 0.82,
    room: 0.55,
  },
  natural: {
    label: 'Natural',
    attack: 0.005,
    sustain: 0.72,
    noise: 1,
    brightness: 1,
    room: 1,
  },
  open: {
    label: 'Open',
    attack: 0.0065,
    sustain: 1.05,
    noise: 0.82,
    brightness: 1.08,
    room: 1.12,
  },
}

const STRUM_DIRECTIONS = [
  { id: 'down', label: 'Downstroke' },
  { id: 'up', label: 'Upstroke' },
]

function TabEditor({ darkMode }) {
  // Audio context for live recording integration
  const audioContext = useAudioContext()
  const { 
    detectedNotes, 
    isListening, 
    syncToEditor, 
    currentRecordingBlob,
    currentRecordingUrl,
    recordings,
    loadRecordings,
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
  const [analysisSource, setAnalysisSource] = useState('current')
  const [selectedAnalysisRecording, setSelectedAnalysisRecording] = useState('')
  const [uploadedAnalysisFile, setUploadedAnalysisFile] = useState(null)
  const [analysisSettings, setAnalysisSettings] = useState({
    bpm: 120,
    subdivision: 2,
    smooth: 7,
    drift: 8,
    delta: 0.07,
  })
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeStudioPanel, setActiveStudioPanel] = useState('compose')
  const [showReferencePreview, setShowReferencePreview] = useState(false)
  
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
  const [playbackProfile, setPlaybackProfile] = useState('balanced')
  const [playbackArticulation, setPlaybackArticulation] = useState('natural')
  const [strumSpread, setStrumSpread] = useState(14)
  const [roomMix, setRoomMix] = useState(18)
  const [strumDirection, setStrumDirection] = useState('down')
  
  const tabRef = useRef(null)
  const pdfRef = useRef(null)
  const audioContextRef = useRef(null)
  const playbackEngineRef = useRef(null)
  const activeAudioNodesRef = useRef([])
  const playbackRef = useRef(null)
  const cellInputRefs = useRef({})
  const lastSyncedNotesCount = useRef(0)
  const analysisFileInputRef = useRef(null)

  useEffect(() => {
    loadSavedTabs()
  }, [])

  useEffect(() => {
    if (!selectedAnalysisRecording && recordings.length > 0) {
      setSelectedAnalysisRecording(recordings[0])
    }
  }, [recordings, selectedAnalysisRecording])

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
      setSavedTabs(Array.isArray(response.data?.tabs) ? response.data.tabs : [])
    } catch (error) {
      console.error('Error loading tabs:', error)
      setSavedTabs([])
    }
  }

  const handleFretChange = (string, col, value) => {
    if (value !== '' && !/^[0-9]{1,2}$|^[xXhHpP/\\bBrRvV~]$/.test(value)) return
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
    } catch {
      showToast('Error saving tab', 'error')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateAnalysisSetting = (key, value) => {
    setAnalysisSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleAnalysisFileChange = (event) => {
    const [file] = event.target.files || []
    setUploadedAnalysisFile(file || null)
  }

  const getApiAssetUrl = useCallback((path) => {
    if (!path) return '#'
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    const apiBase = API_URL.replace(/\/$/, '')
    if (path.startsWith('/api/')) {
      return `${apiBase}${path.slice(4)}`
    }
    if (path.startsWith('/')) {
      return `${apiBase}${path}`
    }
    return `${apiBase}/${path}`
  }, [])

  const analyzeAudioToTab = async () => {
    if (analysisSource === 'current' && !currentRecordingBlob) {
      showToast('Record something first, then stop the session to analyze it.', 'error')
      return
    }

    if (analysisSource === 'saved' && !selectedAnalysisRecording) {
      showToast('Choose a saved recording to analyze.', 'error')
      return
    }

    if (analysisSource === 'upload' && !uploadedAnalysisFile) {
      showToast('Choose an MP3 or audio file to analyze.', 'error')
      return
    }

    setIsAnalyzingAudio(true)
    setAnalysisResult(null)

    try {
      let response

      if (analysisSource === 'current' || analysisSource === 'upload') {
        const formData = new FormData()
        if (analysisSource === 'current') {
          const filename = currentRecordingBlob.type?.includes('wav') ? 'current-recording.wav' : 'current-recording.webm'
          formData.append('audio_file', currentRecordingBlob, filename)
        } else {
          formData.append('audio_file', uploadedAnalysisFile, uploadedAnalysisFile.name || 'uploaded-audio.mp3')
        }
        formData.append('bpm', String(analysisSettings.bpm))
        formData.append('subdivision', String(analysisSettings.subdivision))
        formData.append('smooth', String(analysisSettings.smooth))
        formData.append('drift', String(analysisSettings.drift))
        formData.append('delta', String(analysisSettings.delta))

        response = await axios.post(`${API_URL}/analyze-audio`, formData)
      } else {
        response = await axios.post(`${API_URL}/analyze-audio`, {
          recording_filename: selectedAnalysisRecording,
          bpm: analysisSettings.bpm,
          subdivision: analysisSettings.subdivision,
          smooth: analysisSettings.smooth,
          drift: analysisSettings.drift,
          delta: analysisSettings.delta,
        })
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Analysis failed.')
      }

      setAnalysisResult(response.data)
      showToast(`Analyzed ${response.data.summary.noteCount} notes`, 'success')
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Audio analysis failed'
      showToast(message, 'error')
    } finally {
      setIsAnalyzingAudio(false)
    }
  }

  const importAnalyzedTab = () => {
    if (!analysisResult?.tabText) {
      showToast('No analyzed tab data to import.', 'error')
      return
    }

    parseTabContent(analysisResult.tabText)
    if (analysisResult.summary?.bpm) {
      setTempo(Math.round(analysisResult.summary.bpm))
    }
    setSectionName('Audio Transcription')
    setActiveStudioPanel('compose')
    setShowImportModal(true)
    showToast('Imported analyzed tab into the editor', 'success')
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
          } catch {
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

  const createImpulseResponse = (ctx, duration = 1.8, decay = 2.2) => {
    const frameCount = Math.floor(ctx.sampleRate * duration)
    const impulse = ctx.createBuffer(2, frameCount, ctx.sampleRate)

    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < frameCount; i += 1) {
        const decayCurve = Math.pow(1 - i / frameCount, decay)
        channelData[i] = (Math.random() * 2 - 1) * decayCurve
      }
    }

    return impulse
  }

  const getPlaybackEngine = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    if (!playbackEngineRef.current || playbackEngineRef.current.ctx !== ctx) {
      const masterGain = ctx.createGain()
      const dryGain = ctx.createGain()
      const roomInput = ctx.createGain()
      const convolver = ctx.createConvolver()
      const wetGain = ctx.createGain()
      const compressor = ctx.createDynamicsCompressor()
      const outputFilter = ctx.createBiquadFilter()

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseData.length; i += 1) {
        noiseData[i] = Math.random() * 2 - 1
      }

      convolver.buffer = createImpulseResponse(ctx)

      compressor.threshold.value = -24
      compressor.knee.value = 20
      compressor.ratio.value = 3
      compressor.attack.value = 0.003
      compressor.release.value = 0.22

      outputFilter.type = 'lowpass'
      outputFilter.frequency.value = 6200
      outputFilter.Q.value = 0.35

      masterGain.gain.value = 0.92
      dryGain.gain.value = 1
      wetGain.gain.value = 0.16
      roomInput.gain.value = 1

      dryGain.connect(compressor)
      roomInput.connect(convolver)
      convolver.connect(wetGain)
      wetGain.connect(compressor)
      compressor.connect(outputFilter)
      outputFilter.connect(masterGain)
      masterGain.connect(ctx.destination)

      playbackEngineRef.current = {
        ctx,
        masterGain,
        dryGain,
        roomInput,
        wetGain,
        outputFilter,
        noiseBuffer,
      }
    }

    const engine = playbackEngineRef.current
    const activeProfile = PLAYBACK_PROFILES[playbackProfile]
    engine.wetGain.gain.setValueAtTime((roomMix / 100) * 0.85, ctx.currentTime)
    engine.outputFilter.frequency.setValueAtTime(
      Math.max(2400, activeProfile.brightness * 1.65),
      ctx.currentTime
    )

    return engine
  }

  const scheduleAudioCleanup = (nodes, endTime) => {
    activeAudioNodesRef.current.push(...nodes)

    const delay = Math.max(
      0,
      Math.ceil((endTime - audioContextRef.current.currentTime) * 1000 + 120)
    )

    window.setTimeout(() => {
      activeAudioNodesRef.current = activeAudioNodesRef.current.filter((node) => !nodes.includes(node))
      nodes.forEach((node) => {
        try {
          node.disconnect?.()
        } catch {
          // Ignore disconnect errors for already released nodes.
        }
      })
    }, delay)
  }

  const stopActiveAudioNodes = useCallback(() => {
    activeAudioNodesRef.current.forEach((node) => {
      try {
        node.stop?.(0)
      } catch {
        // Ignore nodes that have already been stopped.
      }

      try {
        node.disconnect?.()
      } catch {
        // Ignore disconnect errors during stop.
      }
    })

    activeAudioNodesRef.current = []
  }, [])

  const primePlaybackOutput = () => {
    const engine = getPlaybackEngine()
    const { ctx, masterGain } = engine
    const targetLevel = 0.92

    masterGain.gain.cancelScheduledValues(ctx.currentTime)
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(targetLevel, ctx.currentTime + 0.02)

    return engine
  }

  const playMetronomeClick = (isDownbeat = false, startOffset = 0) => {
    const engine = getPlaybackEngine()
    const { ctx, dryGain } = engine
    const startTime = ctx.currentTime + startOffset

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const clickFilter = ctx.createBiquadFilter()

    osc.type = isDownbeat ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 980, startTime)

    clickFilter.type = 'bandpass'
    clickFilter.frequency.setValueAtTime(isDownbeat ? 1600 : 1120, startTime)
    clickFilter.Q.value = 1.4

    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.linearRampToValueAtTime(isDownbeat ? 0.12 : 0.08, startTime + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05)

    osc.connect(clickFilter)
    clickFilter.connect(gainNode)
    gainNode.connect(dryGain)

    osc.start(startTime)
    osc.stop(startTime + 0.055)

    scheduleAudioCleanup([osc, gainNode, clickFilter], startTime + 0.08)
  }

  const playNote = (stringName, fret, duration = 0.3, startOffset = 0) => {
    const engine = getPlaybackEngine()
    const profile = PLAYBACK_PROFILES[playbackProfile]
    const articulation = PLAYBACK_ARTICULATIONS[playbackArticulation]
    const { ctx, dryGain, roomInput, noiseBuffer } = engine

    const frequency = getFretFrequency(stringName, fret)
    const stringIndex = STRINGS.indexOf(stringName)
    const startTime = ctx.currentTime + startOffset
    const noteDuration = Math.min(1.8, Math.max(0.16, duration * articulation.sustain))
    const peakGain = 0.38 + (stringIndex / (STRINGS.length - 1)) * 0.08

    const noteGain = ctx.createGain()
    const roomSend = ctx.createGain()
    const panNode = ctx.createStereoPanner()
    const highPass = ctx.createBiquadFilter()
    const toneFilter = ctx.createBiquadFilter()
    const bodyFilter = ctx.createBiquadFilter()

    const fundamental = ctx.createOscillator()
    const shimmer = ctx.createOscillator()
    const secondHarmonic = ctx.createOscillator()
    const thirdHarmonic = ctx.createOscillator()
    const fundamentalGain = ctx.createGain()
    const shimmerGain = ctx.createGain()
    const secondGain = ctx.createGain()
    const thirdGain = ctx.createGain()

    const pickNoise = ctx.createBufferSource()
    const noiseFilter = ctx.createBiquadFilter()
    const noiseEnvelope = ctx.createGain()

    highPass.type = 'highpass'
    highPass.frequency.value = 60

    toneFilter.type = 'lowpass'
    toneFilter.frequency.setValueAtTime(
      Math.max(1800, profile.brightness * articulation.brightness),
      startTime
    )
    toneFilter.frequency.exponentialRampToValueAtTime(
      Math.max(1100, profile.brightness * 0.58),
      startTime + noteDuration
    )
    toneFilter.Q.value = 0.75

    bodyFilter.type = 'peaking'
    bodyFilter.frequency.value = Math.max(120, Math.min(360, frequency * 1.6))
    bodyFilter.Q.value = 0.95
    bodyFilter.gain.value = profile.bodyGain

    noteGain.gain.setValueAtTime(0.0001, startTime)
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + articulation.attack)
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.12, peakGain * 0.46),
      startTime + Math.min(0.12, noteDuration * 0.35)
    )
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration)

    roomSend.gain.value = Math.min(0.42, (roomMix / 100) * 0.72 * profile.roomBias * articulation.room)
    panNode.pan.value = ((stringIndex / (STRINGS.length - 1)) - 0.5) * 0.46

    fundamental.type = 'triangle'
    fundamental.frequency.setValueAtTime(frequency, startTime)
    shimmer.type = playbackProfile === 'bright' ? 'sawtooth' : 'triangle'
    shimmer.frequency.setValueAtTime(frequency, startTime)
    shimmer.detune.setValueAtTime(profile.detune, startTime)
    secondHarmonic.type = 'sine'
    secondHarmonic.frequency.setValueAtTime(frequency * 2, startTime)
    thirdHarmonic.type = 'sine'
    thirdHarmonic.frequency.setValueAtTime(frequency * 3, startTime)

    fundamentalGain.gain.value = 0.34
    shimmerGain.gain.value = 0.12
    secondGain.gain.value = profile.overtone2
    thirdGain.gain.value = profile.overtone3

    pickNoise.buffer = noiseBuffer
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(
      Math.max(1800, profile.brightness * 0.95),
      startTime
    )
    noiseFilter.Q.value = 0.85
    noiseEnvelope.gain.setValueAtTime(0.0001, startTime)
    noiseEnvelope.gain.linearRampToValueAtTime(
      profile.pickNoise * articulation.noise,
      startTime + 0.002
    )
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.04)

    fundamental.connect(fundamentalGain)
    shimmer.connect(shimmerGain)
    secondHarmonic.connect(secondGain)
    thirdHarmonic.connect(thirdGain)

    fundamentalGain.connect(noteGain)
    shimmerGain.connect(noteGain)
    secondGain.connect(noteGain)
    thirdGain.connect(noteGain)

    pickNoise.connect(noiseFilter)
    noiseFilter.connect(noiseEnvelope)
    noiseEnvelope.connect(noteGain)

    noteGain.connect(highPass)
    highPass.connect(toneFilter)
    toneFilter.connect(bodyFilter)
    bodyFilter.connect(panNode)
    panNode.connect(dryGain)
    panNode.connect(roomSend)
    roomSend.connect(roomInput)

    const voiceNodes = [
      fundamental,
      shimmer,
      secondHarmonic,
      thirdHarmonic,
      pickNoise,
      fundamentalGain,
      shimmerGain,
      secondGain,
      thirdGain,
      noteGain,
      roomSend,
      panNode,
      highPass,
      toneFilter,
      bodyFilter,
      noiseFilter,
      noiseEnvelope,
    ]

    const stopTime = startTime + noteDuration + 0.06

    fundamental.start(startTime)
    shimmer.start(startTime)
    secondHarmonic.start(startTime)
    thirdHarmonic.start(startTime)
    pickNoise.start(startTime)

    fundamental.stop(stopTime)
    shimmer.stop(stopTime)
    secondHarmonic.stop(stopTime)
    thirdHarmonic.stop(stopTime)
    pickNoise.stop(startTime + 0.05)

    scheduleAudioCleanup(voiceNodes, stopTime + 0.08)
  }

  const playColumn = (colIndex, beatDuration) => {
    const notes = STRINGS
      .map((stringName, stringIndex) => ({
        stringName,
        stringIndex,
        fret: tabData[stringName][colIndex],
      }))
      .filter(({ fret }) => fret && !Number.isNaN(Number(fret)) && fret !== 'x' && fret !== 'X')

    if (notes.length === 0) {
      return
    }

    const orderedNotes = [...notes].sort((a, b) => (
      strumDirection === 'down'
        ? b.stringIndex - a.stringIndex
        : a.stringIndex - b.stringIndex
    ))

    const spreadSeconds = Math.max(0, strumSpread) / 1000
    const noteStep = orderedNotes.length > 1 ? spreadSeconds / (orderedNotes.length - 1) : 0

    orderedNotes.forEach((note, index) => {
      playNote(
        note.stringName,
        parseInt(note.fret, 10),
        beatDuration,
        noteStep * index
      )
    })
  }

  const playTab = () => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    primePlaybackOutput()
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
      playColumn(currentCol, beatDuration)
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

    if (playbackEngineRef.current) {
      const { ctx, masterGain } = playbackEngineRef.current
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)
    }

    stopActiveAudioNodes()
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
        setActiveStudioPanel('compose')
        showToast(`Loaded ${filename}`, 'success')
      }
    } catch {
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
          } else if (/[xXhHpP/\\]/.test(fretData[i])) {
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
    setActiveStudioPanel('compose')
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
      stopActiveAudioNodes()
    }
  }, [stopActiveAudioNodes])

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

  const totalColumns = bars * NOTES_PER_BAR
  const currentStudioPanel = STUDIO_PANELS.find((panel) => panel.id === activeStudioPanel) ?? STUDIO_PANELS[0]
  const studioSummary = [
    { label: 'Bars', value: bars },
    { label: 'Columns', value: totalColumns },
    { label: 'Mode', value: mode === 'grid' ? 'Grid' : 'Text' },
    { label: 'Live notes', value: detectedNotes.length },
  ]

  return (
    <div className="tab-workspace space-y-6">
      <section className={`rounded-[32px] border px-6 py-6 shadow-xl backdrop-blur-2xl transition-colors duration-300 sm:px-8 ${
        darkMode
          ? 'border-white/10 bg-slate-950/70 text-white shadow-black/25'
          : 'border-white/75 bg-white/78 text-slate-900 shadow-slate-900/8'
      }`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="app-kicker">Studio workspace</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Focused tab editing with live input close at hand.
            </h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Write directly in the grid, sync live notes when inspiration hits, analyze recorded takes, then export a clean result without leaving the same surface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {studioSummary.map((item) => (
              <div
                key={item.label}
                className={`rounded-[22px] border px-4 py-4 ${
                  darkMode ? 'border-white/8 bg-white/[0.035]' : 'border-slate-950/6 bg-slate-950/[0.03]'
                }`}
              >
                <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {item.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
          <div className={`rounded-[24px] border px-4 py-4 ${
            darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/86'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                isListening
                  ? darkMode ? 'bg-emerald-500/16 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  : darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'
              }`}>
                {isListening ? 'Listening live' : 'Ready for live capture'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                syncToEditor
                  ? darkMode ? 'bg-sky-500/16 text-sky-300' : 'bg-sky-100 text-sky-700'
                  : darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'
              }`}>
                {syncToEditor ? 'Sync to editor on' : 'Sync to editor off'}
              </span>
            </div>
            <p className={`mt-4 text-sm leading-7 ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              The editor remains the center of gravity. Recording, playback, practice mode, and audio analysis stay nearby so you can move quickly without a crowded first impression.
            </p>
          </div>

          <div className={`rounded-[24px] border px-4 py-4 ${
            darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-white/86'
          }`}>
            <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Current section
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{sectionName}</div>
            <div className={`mt-2 text-sm ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Tempo {tempo} BPM · {timeSignature.top}/{timeSignature.bottom} time
            </div>
          </div>
        </div>
      </section>

      <section className={`overflow-hidden rounded-[30px] border shadow-xl backdrop-blur-2xl transition-colors duration-300 ${
        darkMode
          ? 'border-white/10 bg-slate-950/70 shadow-black/25'
          : 'border-white/80 bg-white/78 shadow-slate-900/8'
      }`}>
        <div className={`border-b px-6 py-5 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="app-kicker">Studio flow</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Work in one focused lane at a time.</h2>
              <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {currentStudioPanel.title}. {currentStudioPanel.body}
              </p>
            </div>
            <div className={`inline-flex flex-wrap items-center gap-2 rounded-full p-1 ${darkMode ? 'bg-white/6' : 'bg-slate-950/[0.04]'}`}>
              {STUDIO_PANELS.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActiveStudioPanel(panel.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeStudioPanel === panel.id
                      ? darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                      : darkMode ? 'text-slate-300 hover:bg-white/8 hover:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {panel.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeStudioPanel === 'compose' && (
            <div className="space-y-4">
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

              {isListening && syncToEditor && (
                <div className={`flex items-center gap-3 rounded-[24px] px-4 py-3 backdrop-blur-xl ${
                  darkMode 
                    ? 'border border-emerald-500/20 bg-emerald-500/10' 
                    : 'border border-emerald-200 bg-emerald-50/90'
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
            </div>
          )}

          {activeStudioPanel === 'analyze' && (
            <div className={`overflow-hidden rounded-[26px] border transition-colors duration-300 ${
              darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-white/82'
            }`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Audio-to-Tab Analysis
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Runs the Python quantized pitch pipeline on a recording, then lets you import the result into the editor.
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Editor import uses an eighth-note grid
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setAnalysisSource('current')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      analysisSource === 'current'
                        ? darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                        : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Current recording
                  </button>
                  <button
                    onClick={() => setAnalysisSource('upload')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      analysisSource === 'upload'
                        ? darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                        : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Upload MP3
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisSource('saved')
                      loadRecordings()
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      analysisSource === 'saved'
                        ? darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                        : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Saved recording
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        BPM
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="300"
                        value={analysisSettings.bpm}
                        onChange={(e) => updateAnalysisSetting('bpm', Math.max(20, Math.min(300, parseInt(e.target.value || '120', 10))))}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                        } border`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Onset threshold
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        max="0.3"
                        step="0.01"
                        value={analysisSettings.delta}
                        onChange={(e) => updateAnalysisSetting('delta', parseFloat(e.target.value || '0.07'))}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                        } border`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Tempo smoothing
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        step="2"
                        value={analysisSettings.smooth}
                        onChange={(e) => updateAnalysisSetting('smooth', parseInt(e.target.value || '7', 10))}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                        } border`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Max drift %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.5"
                        value={analysisSettings.drift}
                        onChange={(e) => updateAnalysisSetting('drift', parseFloat(e.target.value || '8'))}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                        } border`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={analyzeAudioToTab}
                    disabled={isAnalyzingAudio}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isAnalyzingAudio
                        ? darkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/12 hover:bg-slate-800'
                    }`}
                  >
                    {isAnalyzingAudio ? 'Analyzing...' : 'Analyze audio'}
                  </button>
                </div>

                {analysisSource === 'current' ? (
                  <div className={`px-4 py-3 rounded-xl text-sm ${
                    darkMode ? 'bg-slate-900/50 text-slate-300 border border-slate-700' : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {currentRecordingUrl
                      ? 'The current in-browser recording is ready to analyze.'
                      : 'Stop a live recording first if you want to analyze the current take without saving it.'}
                  </div>
                ) : analysisSource === 'saved' ? (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Saved recording
                      </label>
                      <select
                        value={selectedAnalysisRecording}
                        onChange={(e) => setSelectedAnalysisRecording(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                        } border`}
                      >
                        {recordings.length === 0 ? (
                          <option value="">No saved recordings</option>
                        ) : (
                          recordings.map((filename) => (
                            <option key={filename} value={filename}>{filename}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <button
                      onClick={loadRecordings}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Refresh list
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Upload audio file
                      </label>
                      <input
                        ref={analysisFileInputRef}
                        type="file"
                        accept=".mp3,audio/mpeg,.wav,audio/wav,.m4a,audio/mp4,.ogg,audio/ogg,.webm,audio/webm"
                        onChange={handleAnalysisFileChange}
                        className="hidden"
                      />
                      <div className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-800 border-slate-200'
                      }`}>
                        {uploadedAnalysisFile
                          ? `${uploadedAnalysisFile.name} (${(uploadedAnalysisFile.size / (1024 * 1024)).toFixed(2)} MB)`
                          : 'No file selected'}
                      </div>
                      <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        MP3 recommended. WAV, M4A, OGG, and WEBM are also supported.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => analysisFileInputRef.current?.click()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Choose file
                      </button>
                      <button
                        onClick={() => {
                          setUploadedAnalysisFile(null)
                          if (analysisFileInputRef.current) {
                            analysisFileInputRef.current.value = ''
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {analysisResult && (
                  <div className={`rounded-2xl border overflow-hidden ${
                    darkMode ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
                  }`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap ${
                      darkMode ? 'border-emerald-500/20' : 'border-emerald-200'
                    }`}>
                      <div>
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Analysis Ready
                        </h4>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          Source: {analysisResult.sourceFilename}
                        </p>
                      </div>
                      <a
                        href={getApiAssetUrl(analysisResult.midiUrl)}
                        download={analysisResult.midiFilename}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-slate-950 text-white hover:bg-slate-800'
                        }`}
                      >
                        Download MIDI
                      </a>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className={`px-3 py-3 rounded-xl ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                          <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Notes</div>
                          <div className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {analysisResult.summary.noteCount}
                          </div>
                        </div>
                        <div className={`px-3 py-3 rounded-xl ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                          <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mapped</div>
                          <div className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {analysisResult.summary.mappedNoteCount}
                          </div>
                        </div>
                        <div className={`px-3 py-3 rounded-xl ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                          <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>BPM</div>
                          <div className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {Math.round(analysisResult.summary.bpm)}
                          </div>
                        </div>
                        <div className={`px-3 py-3 rounded-xl ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                          <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Shift</div>
                          <div className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {analysisResult.summary.averageQuantizationShiftMs} ms
                          </div>
                        </div>
                        <div className={`px-3 py-3 rounded-xl ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                          <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Duration</div>
                          <div className={`text-lg font-semibold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {analysisResult.summary.durationSeconds}s
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl p-4 ${darkMode ? 'bg-slate-900/40' : 'bg-white/80'}`}>
                        <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          First detected notes
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                          {analysisResult.notes.slice(0, 6).map((note) => (
                            <div
                              key={`${note.index}-${note.startTime}`}
                              className={`px-3 py-2 rounded-lg text-sm ${
                                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="font-medium">{note.noteName}</span>
                              {note.position ? ` on ${note.position.string} fret ${note.position.fret}` : ' (unmapped)'}
                              <span className="opacity-70"> at {note.quantizedStartTime.toFixed(2)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={importAnalyzedTab}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            darkMode ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'
                          }`}
                        >
                          Import into editor
                        </button>
                        <button
                          onClick={() => setAnalysisResult(null)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Clear result
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStudioPanel === 'library' && (
            <div className={`overflow-hidden rounded-[26px] border transition-colors duration-300 ${
              darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-white/82'
            }`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Saved Tabs
                    </h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Reload earlier drafts without leaving the studio.
                    </p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    darkMode ? 'bg-white/8 text-slate-300' : 'bg-slate-950/[0.05] text-slate-600'
                  }`}>
                    {savedTabs.length} saved
                  </div>
                </div>
              </div>
              <div className="p-3">
                {savedTabs.length === 0 ? (
                  <div className={`rounded-[22px] border px-5 py-8 text-center ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>No saved tabs yet</div>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Save the current tab once and it will show up here as your lightweight studio library.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedTabs.map((tab, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3 transition-colors ${
                          darkMode ? 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]' : 'border-slate-200 bg-white/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            darkMode ? 'bg-white/8' : 'bg-slate-950/[0.05]'
                          }`}>
                            <svg className={`w-5 h-5 ${darkMode ? 'text-sky-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                          </div>
                          <span className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{tab}</span>
                        </div>
                        <button
                          onClick={() => loadTab(tab)}
                          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                            darkMode ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                          </svg>
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Editor Card */}
      <div className={`overflow-hidden rounded-[30px] border shadow-xl backdrop-blur-2xl transition-colors duration-300 ${
        darkMode 
          ? 'border-white/10 bg-slate-950/70 shadow-black/25' 
          : 'border-white/80 bg-white/78 shadow-slate-900/8'
      }`}>
        {/* Header Controls */}
        <div className={`border-b px-6 py-5 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="max-w-3xl">
              <div className="app-kicker">Composition surface</div>
              <h2 className={`mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Keep the notation clear. Pull in extra tools only when they help.
              </h2>
              <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Set the section details once, choose grid or text entry, then reveal practice controls or the text reference only when you need them.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                onClick={saveTab}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  darkMode ? 'bg-white text-slate-950 shadow-lg shadow-black/20 hover:bg-slate-100' : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save tab
              </button>
              <button
                onClick={() => setShowSampleTabs(true)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  darkMode ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
                Sample tabs
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className={`rounded-[24px] border p-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-white/82'}`}>
              <div className={`text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Tab details
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className={`block text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Section</label>
                  <input
                    type="text"
                    className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      darkMode ? 'border-slate-600 bg-slate-700 text-white focus:ring-indigo-500' : 'border-slate-200 bg-white text-slate-800 focus:ring-indigo-500'
                    } focus:outline-none focus:ring-2`}
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tempo</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      className={`w-full rounded-xl border px-3 py-2.5 pr-12 text-sm transition-colors ${
                        darkMode ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-800'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                      min={40}
                      max={240}
                    />
                    <span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      BPM
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Time signature</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      className={`w-full rounded-xl border px-3 py-2.5 text-center text-sm transition-colors ${
                        darkMode ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-800'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      value={timeSignature.top}
                      onChange={(e) => setTimeSignature(prev => ({ ...prev, top: parseInt(e.target.value) || 4 }))}
                      min={1}
                      max={16}
                    />
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>/</span>
                    <input
                      type="number"
                      className={`w-full rounded-xl border px-3 py-2.5 text-center text-sm transition-colors ${
                        darkMode ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-800'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      value={timeSignature.bottom}
                      onChange={(e) => setTimeSignature(prev => ({ ...prev, bottom: parseInt(e.target.value) || 4 }))}
                      min={1}
                      max={16}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bars</label>
                  <div className={`mt-1 flex items-center justify-between rounded-xl border px-2 py-2 ${
                    darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-white'
                  }`}>
                    <button
                      type="button"
                      onClick={removeBar}
                      disabled={bars <= 1}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                        bars <= 1
                          ? darkMode ? 'cursor-not-allowed text-slate-500' : 'cursor-not-allowed text-slate-300'
                          : darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      −
                    </button>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{bars}</span>
                    <button
                      type="button"
                      onClick={addBar}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                        darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-[24px] border p-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-white/82'}`}>
              <div className={`text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                View and helpers
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <button 
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      mode === 'grid'
                        ? darkMode ? 'bg-white text-slate-950 shadow-sm' : 'bg-slate-950 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setMode('grid')}
                  >
                    Grid
                  </button>
                  <button 
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      mode === 'text'
                        ? darkMode ? 'bg-white text-slate-950 shadow-sm' : 'bg-slate-950 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setMode('text')}
                  >
                    Text
                  </button>
                </div>

                <button
                  onClick={() => setShowTechniqueHints(!showTechniqueHints)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    showTechniqueHints
                      ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                      : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Toggle technique symbols"
                >
                  {showTechniqueHints ? 'Technique hints on' : 'Technique hints off'}
                </button>

                <button
                  onClick={() => setShowPracticeMode(!showPracticeMode)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    showPracticeMode
                      ? darkMode ? 'bg-white text-slate-950 shadow-sm' : 'bg-slate-950 text-white shadow-sm'
                      : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {showPracticeMode ? 'Hide practice' : 'Open practice'}
                </button>

              </div>
              <p className={`mt-4 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {mode === 'grid'
                  ? 'Grid mode keeps the notation front and center. A lighter text reference sits below the editor when you want a quick copyable version.'
                  : 'Text mode becomes the raw ASCII editing surface, so the extra reference preview can stay out of the way.'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'grid' ? (
          <div className="p-6">
            {/* Professional Tab Display */}
            <div 
              ref={pdfRef}
              className={`rounded-xl p-6 overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-950 border border-white/8' : 'border border-slate-200 bg-slate-50'
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
                    ? 'bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-500' 
                    : darkMode ? 'bg-white text-slate-950 shadow-black/20 hover:bg-slate-100' : 'bg-slate-950 text-white shadow-slate-900/10 hover:bg-slate-800'
                }`}
                onClick={playTab}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1"/>
                      <rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                    Stop playback
                    {loopEnabled && currentRepeat > 0 && (
                      <span className="text-xs opacity-75">Loop {currentRepeat}</span>
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
                      <span className="text-xs opacity-75">Loop active</span>
                    )}
                  </>
                )}
              </button>

              {/* Export PDF Button */}
              <button 
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg
                  ${darkMode ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-white text-slate-900 hover:bg-slate-100'} 
                  ${isExporting ? 'opacity-75 cursor-wait' : ''}`}
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button 
                className="px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-1"
                onClick={clearAll}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear tab
              </button>
            </div>

            {/* Practice Mode Panel */}
            {showPracticeMode && (
              <div className={`mt-4 overflow-hidden rounded-[26px] border transition-all duration-300 ${
                darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-950/6 bg-slate-50/90'
              }`}>
                {/* Panel Header */}
                <div className={`px-4 py-3 border-b flex items-center gap-2 ${
                  darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-white/80'
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
                  <div className={`rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-slate-950/70' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                      <h4 className={`text-sm font-medium flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
                        </svg>
                        Playback Feel
                      </h4>
                      <span className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {PLAYBACK_PROFILES[playbackProfile].label} · {PLAYBACK_ARTICULATIONS[playbackArticulation].label}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Tone profile
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PLAYBACK_PROFILES).map(([id, profile]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setPlaybackProfile(id)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                playbackProfile === id
                                  ? darkMode ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                                  : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {profile.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Articulation
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(PLAYBACK_ARTICULATIONS).map(([id, articulation]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setPlaybackArticulation(id)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                playbackArticulation === id
                                  ? darkMode ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                                  : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {articulation.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className={`rounded-[18px] p-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Strum spread
                          </label>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {strumSpread} ms
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="2"
                          value={strumSpread}
                          onChange={(e) => setStrumSpread(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {STRUM_DIRECTIONS.map((direction) => (
                            <button
                              key={direction.id}
                              type="button"
                              onClick={() => setStrumDirection(direction.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                strumDirection === direction.id
                                  ? darkMode ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                                  : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {direction.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={`rounded-[18px] p-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Room mix
                          </label>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {roomMix}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="2"
                          value={roomMix}
                          onChange={(e) => setRoomMix(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className={`mt-3 text-xs leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          A little room and stagger helps chords feel less machine-perfect without turning the mix cloudy.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Speed Control Section */}
                  <div className={`rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-slate-950/70' : 'border-slate-200 bg-white'}`}>
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
                              ? darkMode ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
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
                    <div className={`flex items-center justify-between rounded-[18px] p-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
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
                  <div className={`rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-slate-950/70' : 'border-slate-200 bg-white'}`}>
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
                        className={`p-3 rounded-xl border border-dashed transition-all flex flex-col items-center gap-1 ${
                          loopEnabled
                            ? loopStart !== null
                              ? 'border-sky-500 bg-sky-500/10'
                              : darkMode 
                                ? 'border-white/10 hover:border-sky-500 hover:bg-sky-500/10' 
                                : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50'
                            : 'opacity-50 cursor-not-allowed border-slate-600'
                        }`}
                      >
                        <span className={`text-lg font-bold ${loopStart !== null ? 'text-sky-400' : 'text-sky-500'}`}>A</span>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {loopStart !== null ? `Column ${loopStart + 1}` : 'Click to set start'}
                        </span>
                      </button>
                      <button
                        onClick={() => setLoopPoint('B')}
                        disabled={!loopEnabled || loopStart === null}
                        className={`p-3 rounded-xl border border-dashed transition-all flex flex-col items-center gap-1 ${
                          loopEnabled && loopStart !== null
                            ? loopEnd !== null
                              ? 'border-sky-500 bg-sky-500/10'
                              : darkMode 
                                ? 'border-white/10 hover:border-sky-500 hover:bg-sky-500/10' 
                                : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50'
                            : 'opacity-50 cursor-not-allowed border-slate-600'
                        }`}
                      >
                        <span className={`text-lg font-bold ${loopEnd !== null ? 'text-sky-400' : 'text-sky-500'}`}>B</span>
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
                    <div className={`mt-3 rounded-[18px] p-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
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
                  <div className={`rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-slate-950/70' : 'border-slate-200 bg-white'}`}>
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
                  <div className={`rounded-[20px] border p-3 text-xs ${darkMode ? 'border-white/8 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <strong className={darkMode ? 'text-white' : 'text-slate-800'}>Tip:</strong> Select a cell in the tab grid, then click A or B buttons to set loop points. 
                    The selected section will repeat during playback.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <textarea
              className={`w-full h-64 resize-none rounded-[22px] border p-4 font-mono text-sm transition-colors ${
                darkMode 
                  ? 'border-white/8 bg-slate-950 text-sky-200' 
                  : 'border-slate-200 bg-slate-50 text-slate-800'
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

        {mode === 'grid' && (
          <div className={`px-6 pb-6 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className={`border-t pt-4 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Text reference
                  </h3>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Reveal the generated ASCII tab only when you want to inspect or copy it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReferencePreview((prev) => !prev)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    showReferencePreview
                      ? darkMode ? 'bg-white text-slate-950 shadow-sm' : 'bg-slate-950 text-white shadow-sm'
                      : darkMode ? 'bg-white/8 text-white hover:bg-white/12' : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {showReferencePreview ? 'Hide reference' : 'Show reference'}
                </button>
              </div>

              {showReferencePreview && (
                <pre className={`mt-4 overflow-x-auto rounded-[22px] p-4 font-mono text-sm ${
                  darkMode ? 'border border-white/8 bg-slate-950 text-sky-200' : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}>
                  {generateTabText()}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sample Tabs Modal */}
      {showSampleTabs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowSampleTabs(false); setSampleTabFilter('all'); setSampleTabSearch(''); }}
          />
          <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[30px] shadow-2xl ${
            darkMode ? 'border border-white/10 bg-slate-950/92' : 'border border-white/80 bg-white/92'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-100 bg-slate-50/85'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    darkMode ? 'bg-white/8' : 'bg-white'
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
                            ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                            : 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
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
                          className={`group relative p-4 rounded-[24px] border transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                            darkMode 
                              ? 'bg-white/[0.03] border-white/8 hover:border-white/14 hover:bg-white/[0.05]' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5'
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
                                ? 'text-sky-300' 
                                : 'text-slate-700'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Load & Play
                            </span>
                          </div>
                          
                          {/* Hover overlay gradient */}
                          <div className={`absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                            darkMode 
                              ? 'bg-gradient-to-t from-white/[0.04] to-transparent' 
                              : 'bg-gradient-to-t from-slate-950/[0.03] to-transparent'
                          }`} />
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              
              {/* Tips section */}
              <div className={`mt-6 flex items-start gap-3 rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-white/8' : 'bg-white'}`}>
                  <svg className={`w-4 h-4 ${darkMode ? 'text-sky-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Quick Tips</h4>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    After loading a sample, use the <span className="font-medium text-sky-500">Play</span> button to hear it.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`max-w-md w-full overflow-hidden rounded-[30px] border shadow-2xl animate-in fade-in zoom-in duration-300 ${
            darkMode ? 'border-white/10 bg-slate-950/94' : 'border-white/80 bg-white/94'
          }`}>
            <div className={`p-6 ${darkMode ? 'border-b border-white/8 bg-white/[0.03] text-white' : 'border-b border-slate-100 bg-slate-50 text-slate-900'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Tab imported</h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ready to refine inside the editor</p>
                </div>
              </div>
            </div>
            
            <div className={`p-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <p className="mb-4">
                The analyzed notes have been added to the tab editor.
                You can now edit, refine, and save the transcription.
              </p>
              
              <div className={`mb-4 rounded-[22px] border p-4 ${darkMode ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
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
                className="app-button-primary w-full"
              >
                Continue editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 rounded-[20px] border px-5 py-3 font-medium shadow-2xl backdrop-blur-xl
          animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' 
            ? darkMode ? 'border-emerald-500/20 bg-slate-950/90 text-white' : 'border-emerald-200 bg-white/92 text-slate-900'
            : darkMode ? 'border-red-500/20 bg-slate-950/90 text-white' : 'border-red-200 bg-white/92 text-slate-900'
        }`}>
          <span className={`h-2.5 w-2.5 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default TabEditor
