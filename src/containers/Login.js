// Render Prop
import React from 'react';
import { Formik } from 'formik';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { Auth } from 'aws-amplify';
import LoaderButton from '../components/LoaderButton';
import './Login.css';

const Login = props => (
  <div className="Login">
    <Formik
      initialValues={{ email: '', password: '', isLoading: false }}
      validate={values => {
        let errors = {};
        if (!values.email) {
          errors.email = 'Required';
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
        ) {
          errors.email = 'Invalid email address';
        }

        if (!values.password) {
          errors.password = 'A password is required';
        } else if (values.password.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        }

        return errors;
      }}
      onSubmit={async (values, { setSubmitting }) => {
        values.isLoading = true;
        try {
          await Auth.signIn(values.email, values.password);
          props.userHasAuthenticated(true);
          // props.history.push('/');
        } catch (e) {
          console.log('Login is broken =>', e);
          values.isLoading = false;
        }
      }}
      render={({
        touched,
        errors,
        values,
        handleChange,
        hanldeBlur,
        handleSubmit,
        isValid,
      }) => (
        <form onSubmit={handleSubmit}>
          <FormGroup controlId="email" bsSize="large">
            <ControlLabel>
              Email *
              {touched.email && errors.email && (
                <h5 color="red">{errors.email}</h5>
              )}
            </ControlLabel>
            <FormControl
              autoFocus
              onChange={handleChange}
              onBlur={hanldeBlur}
              value={values.email}
              border={touched.email && errors.email && '1px solid red'}
              type="email"
              name="email"
              placeholder="Email"
            />
          </FormGroup>
          <FormGroup controlId="password" bsSize="large">
            <ControlLabel>
              Password *
              {touched.password && errors.password && (
                <h5 color="red">{errors.password}</h5>
              )}
            </ControlLabel>
            <FormControl
              onChange={handleChange}
              onBlur={hanldeBlur}
              value={values.password}
              border={touched.password && errors.password && '1px solid red'}
              type="password"
              name="password"
              placeholder="Password"
            />
          </FormGroup>
          {/* <Button block bsSize="large" disabled={!isValid} type="submit">
            Login
          </Button> */}
          <LoaderButton
            block
            bsSize="large"
            disabled={!isValid}
            type="submit"
            isLoading={values.isLoading}
            text="Login"
            loadingText="Logging in..."
          />
        </form>
      )}
    />
  </div>
);

export default Login;
