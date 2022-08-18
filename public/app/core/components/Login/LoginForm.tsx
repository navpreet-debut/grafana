import { css } from '@emotion/css';
import React, { FC, ReactElement } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button, Form, Input, Field } from '@grafana/ui';

import { PasswordField } from '../PasswordField/PasswordField';

import { FormModel } from './LoginCtrl';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
  width: 100%;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  padding: 12px;
  text-transform: uppercase;
  border: none;
  border-radius: 0;
  background-color: #2999d3;
  text-align: center;
  cursor: pointer;
`;

const customStyle = css`
   {
    font-size: 14px;
    color: #373737;
    height: 40px;
    padding: 0 12px;
    border-radius: 5px;
    background-color: #f3f3f3;
    background-clip: padding-box;
    box-sizing: border-box;
    border: 1px solid #dedede;
    display: block;
    width: 100%;
  }
`;

export const LoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field label="Email or username" invalid={!!errors.user} error={errors.user?.message}>
              <Input
                {...register('user', { required: 'Email or username is required' })}
                autoFocus
                autoCapitalize="none"
                placeholder={loginHint}
                aria-label={selectors.pages.Login.username}
                className={customStyle}
              />
            </Field>
            <Field label="Password" invalid={!!errors.password} error={errors.password?.message}>
              <PasswordField
                id="current-password"
                autoComplete="current-password"
                passwordHint={passwordHint}
                {...register('password', { required: 'Password is required' })}
              />
            </Field>
            <Button
              type="submit"
              aria-label={selectors.pages.Login.submit}
              className={submitButton}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
