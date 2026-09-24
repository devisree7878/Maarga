import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Hash,
  Grid3x3,
  Puzzle,
  Users,
  Loader2,
} from 'lucide-react';

import Header from '../components/layout/Header';
import Card from '../components/ui/Card';

import { useAuth } from '../context/AuthContext';
import {
  fetchMyGameSessions,
  GAME_TYPES,
} from '../services/gamesService';

import NumberSequenceGame from '../components/games/NumberSequenceGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import PatternLogicGame from '../components/games/PatternLogicGame';
import MultiplayerGame from '../components/games/MultiplayerGame';


const GAMES = [
  {
    key: 'number_sequence',
    title: 'Number Sequence',
    desc: 'Spot the pattern and predict what comes next.',
    icon: Hash,
  },
  {
    key: 'memory_match',
    title: 'Memory Match',
    desc: 'Flip cards and find every matching pair.',
    icon: Grid3x3,
  },
  {
    key: 'pattern_logic',
    title: 'Pattern Logic',
    desc: 'Identify the missing shape in the pattern.',
    icon: Puzzle,
  },
];


export default function GamesPage() {

  const { user } = useAuth();

  const [active, setActive] = useState(null);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {

    if (!user?.id) {
      return;
    }


    let cancelled = false;

    setLoading(true);


    fetchMyGameSessions(user.id, 10)
      .then((rows) => {

        if (!cancelled) {

          setHistory(rows);

          setLoading(false);

        }

      })
      .catch((error) => {

        console.error(
          'Failed to load game history:',
          error
        );

        if (!cancelled) {

          setHistory([]);

          setLoading(false);

        }

      });


    return () => {

      cancelled = true;

    };

  }, [user?.id, reloadKey]);


  const exitGame = () => {

    setActive(null);

    setReloadKey((key) => key + 1);

  };


  /*
   * MULTIPLAYER
   */

  if (active === 'multiplayer') {

    return (
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10">

        <MultiplayerGame
          user={user}
          onExit={exitGame}
        />

      </div>
    );

  }


  /*
   * SOLO GAMES
   */

  if (
    active === 'number_sequence' ||
    active === 'memory_match' ||
    active === 'pattern_logic'
  ) {

    return (
      <div className="px-4 md:px-8 py-6 pb-24 md:pb-10">

        <button
          type="button"
          onClick={exitGame}
          className="
            inline-flex items-center gap-2
            mb-5 px-4 py-2.5
            rounded-xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
            text-sm font-semibold
            text-[rgb(var(--text))]
            hover:bg-[rgb(var(--surface-hover))]
            hover:border-[rgb(var(--border))]
            transition-all
          "
        >
          <ArrowLeft size={17} />
          Back to Games
        </button>


        {active === 'number_sequence' && (
          <NumberSequenceGame
            onExit={exitGame}
          />
        )}


        {active === 'memory_match' && (
          <MemoryMatchGame
            onExit={exitGame}
          />
        )}


        {active === 'pattern_logic' && (
          <PatternLogicGame
            onExit={exitGame}
          />
        )}

      </div>
    );

  }


  /*
   * GAMES LIBRARY
   */

  return (
    <div>

      <Header
        title="Brain Games"
        subtitle="Train your mind with quick IQ challenges"
      />


      <div className="
        px-4 md:px-8
        py-6 pb-24 md:pb-10
        space-y-6
      ">


        {/* =================================================
            MULTIPLAYER
        ================================================= */}

        <Card className="
          p-5 md:p-6
          border
          border-[rgb(var(--border-soft))]
          overflow-hidden
          relative
        ">

          <div className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-5
          ">

            <div className="
              flex
              items-start
              gap-4
            ">

              <div className="
                w-12 h-12
                rounded-xl
                accent-gradient
                flex
                items-center
                justify-center
                shadow-glow
                shrink-0
              ">
                <Users
                  size={21}
                  className="text-white"
                />
              </div>


              <div>

                <div className="
                  flex
                  items-center
                  gap-2
                  flex-wrap
                ">

                  <p className="
                    text-base
                    font-bold
                    text-[rgb(var(--text))]
                  ">
                    Multiplayer Mind Battle
                  </p>


                  <span className="
                    px-2 py-0.5
                    rounded-full
                    text-[10px]
                    font-bold
                    accent-bg
                    text-white
                  ">
                    2–3 PLAYERS
                  </span>

                </div>


                <p className="
                  mt-1
                  text-sm
                  text-[rgb(var(--text-muted))]
                  max-w-xl
                ">
                  Challenge your friends with quick
                  math, alphabet, pattern and logic
                  questions. Fast correct answers earn
                  more points.
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() => setActive('multiplayer')}
              className="
                shrink-0
                px-5 py-3
                rounded-xl
                accent-bg
                text-white
                text-sm
                font-bold
                hover:brightness-110
                transition-all
              "
            >
              Play with Friends
            </button>

          </div>

        </Card>


        {/* =================================================
            SOLO GAMES
        ================================================= */}

        <div>

          <div className="
            flex
            items-center
            justify-between
            mb-3
          ">

            <h2 className="
              text-base
              font-bold
              text-[rgb(var(--text))]
            ">
              Solo Games
            </h2>


            <span className="
              text-xs
              text-[rgb(var(--text-dim))]
            ">
              Train individually
            </span>

          </div>


          <div className="
            grid
            sm:grid-cols-3
            gap-4
          ">

            {GAMES.map((game) => {

              const Icon = game.icon;


              return (
                <Card
                  key={game.key}
                  className="
                    p-5
                    flex
                    flex-col
                  "
                >

                  <div className="
                    w-10 h-10
                    rounded-xl
                    accent-gradient
                    flex
                    items-center
                    justify-center
                    shadow-glow
                    mb-4
                  ">

                    <Icon
                      size={18}
                      className="text-white"
                    />

                  </div>


                  <p className="
                    text-sm
                    font-bold
                    text-[rgb(var(--text))]
                    mb-1
                  ">
                    {game.title}
                  </p>


                  <p className="
                    text-xs
                    text-[rgb(var(--text-muted))]
                    mb-4
                    flex-1
                  ">
                    {game.desc}
                  </p>


                  <button
                    type="button"
                    onClick={() => setActive(game.key)}
                    className="
                      w-full
                      py-2.5
                      rounded-xl
                      accent-bg
                      text-white
                      text-sm
                      font-semibold
                      hover:brightness-110
                      transition-all
                    "
                  >
                    Play
                  </button>

                </Card>
              );

            })}

          </div>

        </div>


        {/* =================================================
            RECENT SESSIONS
        ================================================= */}

        <div>

          <h2 className="
            text-base
            font-bold
            text-[rgb(var(--text))]
            mb-3
          ">
            Recent Sessions
          </h2>


          <Card className="
            divide-y
            divide-[rgb(var(--border-soft))]
          ">

            {loading ? (

              <div className="
                p-6
                flex
                items-center
                justify-center
                text-[rgb(var(--text-dim))]
              ">

                <Loader2
                  size={16}
                  className="animate-spin"
                />

              </div>

            ) : history.length === 0 ? (

              <p className="
                p-6
                text-sm
                text-[rgb(var(--text-muted))]
                text-center
              ">
                No games played yet. Play one above
                to start tracking your performance.
              </p>

            ) : (

              history.map((session) => (

                <div
                  key={session.id}
                  className="
                    flex
                    items-center
                    justify-between
                    px-4 py-3
                  "
                >

                  <div>

                    <p className="
                      text-sm
                      font-medium
                      text-[rgb(var(--text))]
                    ">
                      {GAME_TYPES[session.game_type] ||
                        session.game_type}
                    </p>


                    <p className="
                      text-xs
                      text-[rgb(var(--text-dim))]
                    ">
                      {new Date(
                        session.completed_at
                      ).toLocaleString()}

                      {' · '}

                      {session.duration_seconds}s
                    </p>

                  </div>


                  <div className="text-right">

                    <p className="
                      text-sm
                      font-bold
                      accent-text
                    ">
                      {session.score}%
                    </p>


                    <p className="
                      text-[11px]
                      text-[rgb(var(--text-dim))]
                    ">
                      {session.correct_answers}✓ /{' '}
                      {session.wrong_answers}✗
                    </p>

                  </div>

                </div>

              ))

            )}

          </Card>

        </div>

      </div>

    </div>
  );
}