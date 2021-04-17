import { differenceInSeconds, format, subMinutes } from 'date-fns';
import addMinutes from 'date-fns/addMinutes';
import { useContext, useEffect, useState } from 'react';
import { EventContext } from '../../app/context/eventContext';
import { PresenterMessagesContext } from '../../app/context/presenterMessageContext';
import Countdown from '../../common/components/countdown/Countdown';
import MyProgressBar from '../../common/components/myProgressBar/MyProgressBar';
import SmallTimer from '../../common/components/smallTimer/SmallTimer';
import './viewers.css';

export default function DefaultPresenter() {
  const [event] = useContext(EventContext);
  const [presMessage] = useContext(PresenterMessagesContext);
  const [initialValues, setInitialValues] = useState(null);

  const now = new Date();
  let values = event ?? {
    title: 'Presentation Title',
    subtitle: 'Presentation Subtitle',
    presenter: 'Presenter Name',
    timerDuration: 10,
    timeStart: now,
    timeEnd: now,
  };

  useEffect(() => {
    values = event;
  }, [event]);

  useEffect(() => {
    setInitialValues(event);
  }, [event]);

  // NOTE: test only
  const clockStarted = addMinutes(now, 6);

  const timer = differenceInSeconds(
    now,
    subMinutes(clockStarted, values.duration)
  );

  const timeStart = format(values.timeStart, 'HH:mm');
  const currentTime = format(now, 'HH:mm');
  const timeEnd = format(values.timeEnd, 'HH:mm');
  const elapsed = timer / (values.duration * 60);

  return (
    <div className='presenter'>
      <div className='presentationTitle'>{values.title}</div>
      <div className='presentationSub'>{values.subtitle}</div>
      <Countdown time={timer} />
      {!presMessage.show && <MyProgressBar normalisedComplete={elapsed} />}
      <div className={presMessage.show ? 'userMessage' : 'userMessage hidden'}>
        {presMessage.text}
      </div>
      <div className='extra'>
        <SmallTimer label='Scheduled Start' time={timeStart} />
        <SmallTimer label='Current Time' time={currentTime} />
        <SmallTimer label='Scheduled End' time={timeEnd} />
      </div>
    </div>
  );
}