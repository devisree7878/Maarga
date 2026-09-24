import React, { useEffect, useMemo, useState } from 'react';

import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Loader2,
  Users,
  Zap,
} from 'lucide-react';

import { supabase } from '../../supabaseClient';

import {
  createMultiplayerMatch,
  joinMultiplayerMatch,
  getMatchPlayers,
  getMatchQuestions,
  startMultiplayerMatch,
  submitMultiplayerAnswer,
  advanceMultiplayerQuestion,
  finalizeMultiplayerMatch,
  getWallet,
} from '../../services/multiplayerGameService';


const ROUND_SECONDS = 10;


export default function MultiplayerGame({ user, onExit }) {

  const [mode, setMode] = useState('menu');

  const [matchCode, setMatchCode] = useState('');

  const [match, setMatch] = useState(null);

  const [players, setPlayers] = useState([]);

  const [questions, setQuestions] = useState([]);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [answerResult, setAnswerResult] = useState(null);

  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  const [wallet, setWallet] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [copied, setCopied] = useState(false);


  const currentQuestion = useMemo(() => {
    if (!match || !questions.length) {
      return null;
    }

    return questions.find(
      (question) =>
        question.question_number === match.current_question
    );
  }, [match, questions]);


  const currentPlayer = useMemo(() => {
    return players.find(
      (player) => player.user_id === user.id
    );
  }, [players, user.id]);


  const isCreator = match?.created_by === user.id;


  const rankings = useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.correct_answers !== a.correct_answers) {
        return b.correct_answers - a.correct_answers;
      }

      return new Date(a.joined_at) - new Date(b.joined_at);
    });
  }, [players]);


  // ========================================================
  // WALLET
  // ========================================================

  useEffect(() => {
    getWallet(user.id)
      .then(setWallet)
      .catch((err) => {
        console.error('Wallet error:', err);
      });
  }, [user.id]);


  // ========================================================
  // MATCH REALTIME
  // ========================================================

  useEffect(() => {

    if (!match?.id) {
      return;
    }


    let cancelled = false;


    async function loadMatchData() {

      try {

        const latestMatch = await supabase
          .from('multiplayer_matches')
          .select('*')
          .eq('id', match.id)
          .single();


        if (cancelled || latestMatch.error) {
          return;
        }


        setMatch(latestMatch.data);


        const playerRows =
          await getMatchPlayers(match.id);

        if (!cancelled) {
          setPlayers(playerRows);
        }


        if (latestMatch.data.status === 'playing') {

          const questionRows =
            await getMatchQuestions(match.id);

          if (!cancelled) {
            setQuestions(questionRows);
            setMode('playing');
          }

        }


        if (latestMatch.data.status === 'finished') {

          if (!cancelled) {
            setMode('finished');
          }

        }

      } catch (err) {
        console.error(err);
      }

    }


    loadMatchData();


    const channel = supabase
      .channel(`maarga-match-${match.id}`)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_matches',
          filter: `id=eq.${match.id}`,
        },
        async (payload) => {

          if (payload.new) {

            setMatch(payload.new);


            if (payload.new.status === 'playing') {

              const questionRows =
                await getMatchQuestions(match.id);

              setQuestions(questionRows);

              setMode('playing');

              setSelectedAnswer(null);
              setAnswerResult(null);
            }


            if (payload.new.status === 'finished') {

              const playerRows =
                await getMatchPlayers(match.id);

              setPlayers(playerRows);

              setMode('finished');

            }

          }

        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'multiplayer_match_players',
          filter: `match_id=eq.${match.id}`,
        },
        async () => {

          const playerRows =
            await getMatchPlayers(match.id);

          setPlayers(playerRows);

        }
      )

      .subscribe();


    return () => {

      cancelled = true;

      supabase.removeChannel(channel);

    };

  }, [match?.id]);


  // ========================================================
  // TIMER
  // ========================================================

  useEffect(() => {

    if (
      mode !== 'playing' ||
      !match?.question_started_at
    ) {
      return;
    }


    const updateTimer = () => {

      const started =
        new Date(match.question_started_at).getTime();

      const elapsed =
        (Date.now() - started) / 1000;

      const remaining =
        Math.max(
          0,
          Math.ceil(ROUND_SECONDS - elapsed)
        );


      setTimeLeft(remaining);


      if (remaining <= 0) {

        advanceMultiplayerQuestion(match.id)
          .catch(() => {});

      }

    };


    updateTimer();


    const timer =
      setInterval(updateTimer, 250);


    return () => {
      clearInterval(timer);
    };

  }, [
    mode,
    match?.id,
    match?.question_started_at,
    match?.current_question,
  ]);


  // ========================================================
  // RESET QUESTION UI WHEN QUESTION CHANGES
  // ========================================================

  useEffect(() => {

    setSelectedAnswer(null);
    setAnswerResult(null);

  }, [match?.current_question]);


  // ========================================================
  // CREATE
  // ========================================================

  async function handleCreate() {

    setLoading(true);
    setError('');


    try {

      const created =
        await createMultiplayerMatch(user);


      setMatch(created);

      setMatchCode(created.match_code);

      setMode('waiting');

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Could not create match.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ========================================================
  // JOIN
  // ========================================================

  async function handleJoin() {

    if (matchCode.trim().length !== 6) {

      setError(
        'Enter the 6-character match code.'
      );

      return;
    }


    setLoading(true);
    setError('');


    try {

      const joined =
        await joinMultiplayerMatch(
          user,
          matchCode
        );


      setMatch(joined);

      setMode('waiting');

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Could not join match.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ========================================================
  // START
  // ========================================================

  async function handleStart() {

    if (!match) {
      return;
    }


    if (players.length < 2) {

      setError(
        'At least 2 players are required.'
      );

      return;
    }


    setLoading(true);
    setError('');


    try {

      const started =
        await startMultiplayerMatch(
          match.id
        );


      setMatch(started);


      const questionRows =
        await getMatchQuestions(match.id);


      setQuestions(questionRows);

      setMode('playing');

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Could not start the match.'
      );

    } finally {

      setLoading(false);

    }

  }


  // ========================================================
  // ANSWER
  // ========================================================

  async function handleAnswer(answer) {

    if (
      !currentQuestion ||
      selectedAnswer
    ) {
      return;
    }


    if (timeLeft <= 0) {
      return;
    }


    setSelectedAnswer(answer);


    try {

      const result =
        await submitMultiplayerAnswer({
          matchId: match.id,
          questionId: currentQuestion.id,
          answer,
        });


      setAnswerResult(result);


      const playerRows =
        await getMatchPlayers(match.id);


      setPlayers(playerRows);

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Could not submit answer.'
      );

      setSelectedAnswer(null);

    }

  }


  // ========================================================
  // FINISH
  // ========================================================

  useEffect(() => {

    if (
      !match ||
      match.status !== 'playing' ||
      match.current_question !== match.total_questions
    ) {
      return;
    }


    if (timeLeft > 0) {
      return;
    }


    finalizeMultiplayerMatch(match.id)
      .then(() => {
        setMode('finished');
      })
      .catch((err) => {
        console.error(err);
      });

  }, [
    match?.id,
    match?.status,
    match?.current_question,
    match?.total_questions,
    timeLeft,
  ]);


  // ========================================================
  // COPY
  // ========================================================

  async function copyCode() {

    if (!match?.match_code) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        match.match_code
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);

    } catch {
      setError(
        'Could not copy the match code.'
      );
    }

  }


  // ========================================================
  // MENU
  // ========================================================

  if (mode === 'menu') {

    return (
      <div className="max-w-4xl mx-auto">

        <button
          onClick={onExit}
          className="
            inline-flex items-center gap-2
            mb-6 px-4 py-2.5
            rounded-xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
            text-sm font-semibold
            text-[rgb(var(--text))]
            hover:bg-[rgb(var(--surface-hover))]
            transition-all
          "
        >
          <ArrowLeft size={17} />
          Back to Games
        </button>


        <div className="mb-8">

          <div className="
            w-12 h-12 rounded-2xl
            accent-gradient
            flex items-center justify-center
            shadow-glow
          ">
            <Users
              size={22}
              className="text-white"
            />
          </div>


          <h1 className="
            mt-4
            text-2xl
            font-black
            text-[rgb(var(--text))]
          ">
            Multiplayer Mind Battle
          </h1>


          <p className="
            mt-2
            text-sm
            text-[rgb(var(--text-muted))]
          ">
            Challenge 1–2 friends.
            Answer quickly and accurately.
            The fastest correct answers earn more points.
          </p>

        </div>


        <div className="grid md:grid-cols-2 gap-5">

          {/* CREATE */}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="
              text-left
              p-6
              rounded-2xl
              border border-[rgb(var(--border-soft))]
              bg-[rgb(var(--surface))]
              hover:border-[rgb(var(--border))]
              transition-all
            "
          >

            <Zap
              size={28}
              className="accent-text mb-4"
            />


            <h2 className="
              text-lg
              font-bold
              text-[rgb(var(--text))]
            ">
              Create Match
            </h2>


            <p className="
              mt-2
              text-sm
              text-[rgb(var(--text-muted))]
            ">
              Create a room and invite your friends.
            </p>


            {loading && (
              <Loader2
                size={18}
                className="mt-4 animate-spin"
              />
            )}

          </button>


          {/* JOIN */}

          <div className="
            p-6
            rounded-2xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
          ">

            <Users
              size={28}
              className="accent-text mb-4"
            />


            <h2 className="
              text-lg
              font-bold
              text-[rgb(var(--text))]
            ">
              Join Match
            </h2>


            <p className="
              mt-2
              text-sm
              text-[rgb(var(--text-muted))]
            ">
              Enter your friend's 6-character code.
            </p>


            <input
              value={matchCode}
              onChange={(e) => {
                setMatchCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 6)
                );
              }}
              placeholder="A7K29P"
              maxLength={6}
              className="
                mt-5
                w-full
                px-4 py-3
                rounded-xl
                border border-[rgb(var(--border-soft))]
                bg-[rgb(var(--background))]
                text-[rgb(var(--text))]
                outline-none
              "
            />


            <button
              onClick={handleJoin}
              disabled={loading}
              className="
                mt-3
                w-full
                py-3
                rounded-xl
                accent-bg
                text-white
                font-semibold
                disabled:opacity-50
              "
            >
              Join Match
            </button>

          </div>

        </div>


        {error && (
          <div className="
            mt-5
            p-4
            rounded-xl
            bg-red-500/10
            border border-red-500/20
            text-red-400
            text-sm
          ">
            {error}
          </div>
        )}

      </div>
    );
  }


  // ========================================================
  // WAITING ROOM
  // ========================================================

  if (mode === 'waiting') {

    return (
      <div className="max-w-3xl mx-auto">

        <button
          onClick={onExit}
          className="
            inline-flex items-center gap-2
            mb-6 px-4 py-2.5
            rounded-xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
            text-sm font-semibold
            text-[rgb(var(--text))]
          "
        >
          <ArrowLeft size={17} />
          Back to Games
        </button>


        <div className="text-center">

          <p className="
            text-sm
            text-[rgb(var(--text-muted))]
          ">
            Match Code
          </p>


          <div className="
            mt-2
            flex
            items-center
            justify-center
            gap-3
          ">

            <h1 className="
              text-4xl
              font-black
              tracking-[0.2em]
              accent-text
            ">
              {match?.match_code}
            </h1>


            <button
              onClick={copyCode}
              className="
                p-2.5
                rounded-xl
                border border-[rgb(var(--border-soft))]
              "
            >
              {copied ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>

          </div>


          <p className="
            mt-3
            text-sm
            text-[rgb(var(--text-muted))]
          ">
            Share this code with your friends.
          </p>

        </div>


        <div className="
          mt-8
          p-6
          rounded-2xl
          border border-[rgb(var(--border-soft))]
          bg-[rgb(var(--surface))]
        ">

          <div className="
            flex
            items-center
            justify-between
            mb-5
          ">

            <h2 className="
              font-bold
              text-[rgb(var(--text))]
            ">
              Players
            </h2>


            <span className="
              text-sm
              text-[rgb(var(--text-muted))]
            ">
              {players.length} / {match?.max_players}
            </span>

          </div>


          <div className="space-y-3">

            {players.map((player, index) => (

              <div
                key={player.id}
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                  rounded-xl
                  bg-[rgb(var(--background))]
                "
              >

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  <div className="
                    w-9 h-9
                    rounded-full
                    accent-bg
                    flex
                    items-center
                    justify-center
                    text-white
                    text-sm
                    font-bold
                  ">
                    {index + 1}
                  </div>


                  <span className="
                    text-sm
                    font-semibold
                    text-[rgb(var(--text))]
                  ">
                    {player.display_name}
                    {player.user_id === user.id && ' (You)'}
                  </span>

                </div>


                <span className="
                  text-xs
                  text-green-400
                ">
                  Connected
                </span>

              </div>

            ))}


            {Array.from({
              length:
                (match?.max_players || 3) -
                players.length,
            }).map((_, index) => (

              <div
                key={`waiting-${index}`}
                className="
                  p-4
                  rounded-xl
                  border border-dashed
                  border-[rgb(var(--border-soft))]
                  text-sm
                  text-[rgb(var(--text-dim))]
                "
              >
                Waiting for player...
              </div>

            ))}

          </div>


          {isCreator && (

            <button
              onClick={handleStart}
              disabled={
                players.length < 2 ||
                loading
              }
              className="
                mt-6
                w-full
                py-3.5
                rounded-xl
                accent-bg
                text-white
                font-bold
                disabled:opacity-40
              "
            >
              {loading
                ? 'Starting...'
                : 'Start Game'}
            </button>

          )}

        </div>


        {error && (
          <div className="
            mt-5
            p-4
            rounded-xl
            bg-red-500/10
            border border-red-500/20
            text-red-400
            text-sm
          ">
            {error}
          </div>
        )}

      </div>
    );
  }


  // ========================================================
  // PLAYING
  // ========================================================

  if (
    mode === 'playing' &&
    currentQuestion
  ) {

    const options = [
      ['A', currentQuestion.option_a],
      ['B', currentQuestion.option_b],
      ['C', currentQuestion.option_c],
      ['D', currentQuestion.option_d],
    ];


    return (
      <div className="max-w-5xl mx-auto">

        <div className="
          flex
          items-center
          justify-between
          mb-6
        ">

          <button
            onClick={onExit}
            className="
              inline-flex
              items-center
              gap-2
              px-4 py-2.5
              rounded-xl
              border border-[rgb(var(--border-soft))]
              bg-[rgb(var(--surface))]
              text-sm
              font-semibold
              text-[rgb(var(--text))]
            "
          >
            <ArrowLeft size={17} />
            Back to Games
          </button>


          <div className="
            flex
            items-center
            gap-4
          ">

            <div className="
              flex
              items-center
              gap-1
              text-sm
              font-bold
              accent-text
            ">
              🪙 {wallet?.coins ?? 0}
            </div>


            <div className="
              min-w-[70px]
              text-center
              px-3 py-2
              rounded-xl
              border
              border-[rgb(var(--border-soft))]
              text-sm
              font-black
              text-[rgb(var(--text))]
            ">
              {timeLeft}s
            </div>

          </div>

        </div>


        <div className="
          grid
          lg:grid-cols-[1fr_260px]
          gap-5
        ">

          {/* QUESTION */}

          <div className="
            p-6 md:p-8
            rounded-2xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wider
                accent-text
              ">
                {currentQuestion.category}
              </span>


              <span className="
                text-sm
                text-[rgb(var(--text-muted))]
              ">
                Question {match.current_question} / {match.total_questions}
              </span>

            </div>


            <h1 className="
              mt-8
              text-2xl
              md:text-3xl
              font-black
              text-[rgb(var(--text))]
            ">
              {currentQuestion.question}
            </h1>


            <div className="
              mt-8
              grid
              sm:grid-cols-2
              gap-3
            ">

              {options.map(
                ([letter, value]) => {

                  const selected =
                    selectedAnswer === letter;


                  const correct =
                    answerResult?.is_correct &&
                    selected;


                  const wrong =
                    answerResult &&
                    selected &&
                    !answerResult.is_correct;


                  let style =
                    'border-[rgb(var(--border-soft))] hover:border-[rgb(var(--border))]';


                  if (correct) {
                    style =
                      'border-green-500 bg-green-500/10';
                  }


                  if (wrong) {
                    style =
                      'border-red-500 bg-red-500/10';
                  }


                  return (
                    <button
                      key={letter}
                      onClick={() =>
                        handleAnswer(letter)
                      }
                      disabled={
                        !!selectedAnswer ||
                        timeLeft <= 0
                      }
                      className={`
                        p-4
                        rounded-xl
                        border
                        text-left
                        transition-all
                        ${style}
                      `}
                    >

                      <span className="
                        inline-flex
                        w-8 h-8
                        rounded-lg
                        accent-bg
                        text-white
                        items-center
                        justify-center
                        text-sm
                        font-bold
                        mr-3
                      ">
                        {letter}
                      </span>


                      <span className="
                        text-sm
                        font-semibold
                        text-[rgb(var(--text))]
                      ">
                        {value}
                      </span>

                    </button>
                  );

                }
              )}

            </div>


            {answerResult && (

              <div className={`
                mt-5
                p-4
                rounded-xl
                text-sm
                font-semibold
                ${
                  answerResult.is_correct
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }
              `}>

                {answerResult.is_correct
                  ? `Correct! +${answerResult.points} points`
                  : 'Incorrect answer'}

              </div>

            )}

          </div>


          {/* LIVE SCORE */}

          <div className="
            p-5
            rounded-2xl
            border border-[rgb(var(--border-soft))]
            bg-[rgb(var(--surface))]
          ">

            <h3 className="
              font-bold
              text-[rgb(var(--text))]
              mb-4
            ">
              Live Scores
            </h3>


            <div className="space-y-3">

              {rankings.map(
                (player, index) => (

                  <div
                    key={player.id}
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div className="
                      flex
                      items-center
                      gap-2
                    ">

                      {index === 0 && (
                        <Crown
                          size={15}
                          className="accent-text"
                        />
                      )}


                      <span className="
                        text-xs
                        text-[rgb(var(--text))]
                      ">
                        {player.display_name}
                        {player.user_id === user.id &&
                          ' (You)'}
                      </span>

                    </div>


                    <span className="
                      text-sm
                      font-bold
                      accent-text
                    ">
                      {player.score}
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ========================================================
  // FINISHED
  // ========================================================

  if (mode === 'finished') {

    const winner =
      rankings[0];


    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center">

          <Crown
            size={56}
            className="mx-auto accent-text"
          />


          <h1 className="
            mt-4
            text-3xl
            font-black
            text-[rgb(var(--text))]
          ">
            Match Complete
          </h1>


          {winner && (
            <p className="
              mt-2
              text-sm
              text-[rgb(var(--text-muted))]
            ">

              {winner.user_id === user.id
                ? 'You won the match! 🎉'
                : `${winner.display_name} won the match!`}

            </p>
          )}

        </div>


        <div className="
          mt-8
          p-5
          rounded-2xl
          border border-[rgb(var(--border-soft))]
          bg-[rgb(var(--surface))]
        ">

          {rankings.map(
            (player, index) => (

              <div
                key={player.id}
                className="
                  flex
                  items-center
                  justify-between
                  py-4
                  border-b
                  last:border-b-0
                  border-[rgb(var(--border-soft))]
                "
              >

                <div className="
                  flex
                  items-center
                  gap-4
                ">

                  <span className="
                    text-lg
                    font-black
                    text-[rgb(var(--text-muted))]
                  ">
                    #{player.final_rank || index + 1}
                  </span>


                  <div>

                    <p className="
                      font-semibold
                      text-[rgb(var(--text))]
                    ">
                      {player.display_name}
                      {player.user_id === user.id &&
                        ' (You)'}
                    </p>


                    <p className="
                      text-xs
                      text-[rgb(var(--text-dim))]
                    ">
                      {player.correct_answers} correct
                    </p>

                  </div>

                </div>


                <div className="text-right">

                  <p className="
                    font-black
                    accent-text
                  ">
                    {player.score}
                  </p>


                  <p className="
                    text-xs
                    text-[rgb(var(--text-muted))]
                  ">
                    +{player.coins_earned} 🪙
                  </p>

                </div>

              </div>

            )
          )}

        </div>


        <div className="
          mt-6
          flex
          gap-3
        ">

          <button
            onClick={onExit}
            className="
              flex-1
              py-3
              rounded-xl
              border border-[rgb(var(--border-soft))]
              text-sm
              font-semibold
            "
          >
            Back to Games
          </button>


          <button
            onClick={() => {

              setMode('menu');

              setMatch(null);

              setQuestions([]);

              setPlayers([]);

              setSelectedAnswer(null);

              setAnswerResult(null);

              setError('');

            }}
            className="
              flex-1
              py-3
              rounded-xl
              accent-bg
              text-white
              text-sm
              font-semibold
            "
          >
            Play Again
          </button>

        </div>

      </div>
    );
  }


  return null;
}