'use strict';

const jibo = require('jibo');
const BeSkill = require('@be/be-framework').BeSkill;

class HelloJibo extends BeSkill {
    // Called every time the skill opens: from its menu button, a launch phrase, or another skill.
    open(result) {
        const views = jibo.face.views;
        const view = views.createView('View', {
            viewConfig: { type: 'View', id: 'hello-jibo', category: 'gui', ignoreSwipeDown: true },
            componentConfigs: [
                { type: 'Label', id: 'title', text: 'Hello from my first skill!',
                  position: { x: 640, y: 170 }, targetAnchor: { x: 0.5, y: 0.5 },
                  style: { fontFamily: 'Proxima Nova Soft', fontSize: 64, fill: '#FFFFFF', fontWeight: 'bold' } },
                { type: 'ActionButton', id: 'talk', iconSrc: 'jibo://resources/actionIcons/play.png',
                  colors: [0x29D780, 0x0F6B3D], position: { x: 541, y: 290 }, transform: { scaleX: 0.75, scaleY: 0.75 },
                  action: { type: views.ActionData.CALLBACK, data: { callback: () => this.talk() } } },
                { type: 'Label', id: 'hint', text: 'Tap the button. Swipe down to leave.',
                  position: { x: 640, y: 600 }, targetAnchor: { x: 0.5, y: 0.5 },
                  style: { fontFamily: 'Proxima Nova Light', fontSize: 40, fill: '#B0BBB2' } }
            ]
        });
        // Swipe down = leave, like every Jibo screen.
        view.addAction(views.ActionData.CALLBACK, { callback: () => this.exit({ noElementsOfSurprise: true }) },
            true, false, views.GESTURE.SWIPE_DOWN);
        views.changeView({ addView: view });
    }

    // Jibo speaks with ESML: plain text plus tags for animations, emojis and sounds.
    talk() {
        jibo.embodied.speech.speak("Hello! <anim cat='happy' nonBlocking='true' /> I'm running your very first skill.")
            .catch(err => this.log.warn('speech failed', err));
    }

    // Called when the skill closes. Remove your screen, stop timers and sounds, then call done().
    close(done) {
        jibo.tts.stop();
        jibo.face.views.changeView({ removeAll: true, leaveEmpty: true }, () => done(), () => done());
    }
}

module.exports = HelloJibo;
